'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { ChevronRight, MapPinned } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SectionRenderer,
  GroupCaption,
  SectionRow,
  pickFields,
  leftoverFields,
  fullWidthField,
  clusterGrid,
  type ClusterContext,
  type StepSchema,
  type SectionSchema,
  type FieldSchema,
  type FieldOption,
} from '@/framework/form-engine'
import { DynamicFormContext } from '@/framework/form-engine/DynamicForm'
import { useDependencyEngine } from '@/framework/form-engine/useDynamicForm'
import { LocationMapPreview } from '../LocationMapPreview'

// Presentation-only redesign of Step 2 (Location & Zoning) — same
// architectural precedent as IdentityGovernanceStepView.tsx: renders the
// exact same StepSchema (same fields, validation, dependencies, visibility,
// readOnlyWhen) through the same SectionRenderer/GridEngine/
// DynamicFormContext/dependency-engine wiring, just with bespoke internal
// grouping and a first-class Map card appended at the end. Field-key
// partitions below are presentation-only lookups into `section.fields` —
// they never touch location-zoning.schema.ts, and any field not claimed by
// a named cluster still renders via the `rest(...)` leftover grid, so a
// future schema addition can never silently disappear from this view.
//
// Business/section order is unchanged: Location → Zoning & Data Quality →
// Proximity & Views → Land Details (Category = Land only) → Contacts →
// Address & Map.

interface LocationZoningStepViewProps {
  schema: StepSchema
  form: UseFormReturn<Record<string, unknown>>
}

/* ── Field-key partitions (presentation grouping only) ───────────────── */

const NARROWING_KEYS = ['regionLocationId', 'subRegionLocationId', 'locationId']
const STREET_KEYS = ['addressStreet']
const CITY_STATE_KEYS = ['addressCity', 'addressState']
// Postal Code, Country, Close To — three compact fields, deliberately
// composed as one row (Layout Rebalance Pass) instead of leaving Close To
// alone in half an empty row. Presentation grouping only: Close To remains
// the exact same field, same key, same position in location-zoning.schema.ts.
const COMPACT_TRIO_KEYS = ['addressPostalCode', 'addressCountry', 'closeTo']

const CLASSIFICATION_KEYS = ['belt', 'withinCityPlan']
const COORDINATE_KEYS = ['addressLatitude', 'addressLongitude', 'addressGeocodeType']

const VIEW_KEYS = ['view']
const DISTANCE_KEYS = ['distanceFromSea', 'distanceFromCity', 'distanceFromVillage', 'distanceFromAirport']

/**
 * A row of fields whose desktop column count is decided by THIS wrapper's
 * own container width, not by each field's individual schema-declared span
 * (which only ever defines up to a 2-up breakpoint — see SchemaBuilder.ts's
 * half()/third()/quarter()). Each field still renders through its own
 * single-field GridEngine call, so visibility/disabled/readOnly/dependency
 * resolution is exactly the shared mechanism, never duplicated — this
 * wrapper only controls layout. Safe against cramping: at any wizard
 * viewport (body capped at max-w-7xl/1280px, see FormFramework.tsx) each
 * resulting cell stays well under the 448px container-query tier, so the
 * nested GridEngine call always renders its field full-width within its
 * cell rather than trying to go 2-up again inside an already-narrow column.
 */
function CompactFieldRow({
  fields, ctx, cols, connectors,
}: {
  fields: FieldSchema[]
  ctx: ClusterContext
  cols: 2 | 3
  connectors?: boolean
}) {
  return (
    <div className="@container">
      <div className={cn(
        'grid grid-cols-1 gap-5',
        cols === 3 ? '@md:grid-cols-2 @4xl:grid-cols-3 @4xl:gap-4' : '@md:grid-cols-2',
      )}>
        {fields.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2">
            {connectors && i > 0 && (
              <ChevronRight
                className="hidden size-4 shrink-0 text-muted-foreground/45 @4xl:block"
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1">{clusterGrid([f], ctx)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Location card body: Geographic Narrowing → Address (Street row →
   City/State row → Postal/Country/Close-to row) ──────────────────────── */

function LocationBody(fields: FieldSchema[], ctx: ClusterContext, t: (key: string) => string) {
  const narrowing = pickFields(fields, NARROWING_KEYS)
  const street = pickFields(fields, STREET_KEYS)
  const cityState = pickFields(fields, CITY_STATE_KEYS)
  const trio = pickFields(fields, COMPACT_TRIO_KEYS)
  const rest = leftoverFields(fields, [NARROWING_KEYS, STREET_KEYS, CITY_STATE_KEYS, COMPACT_TRIO_KEYS])

  return (
    // Final polish pass: was space-y-7, the one body-composer in the wizard
    // one step out of rhythm with its own siblings (ZoningBody/ProximityBody
    // below, and Pricing's PricingBody/NegotiationBody all use space-y-6).
    <div className="space-y-6">
      {narrowing.length > 0 && (
        <div>
          <GroupCaption text={t('wizard.steps.locationZoning.sections.location.groups.narrowing')} />
          <CompactFieldRow fields={narrowing} ctx={ctx} cols={3} connectors />
        </div>
      )}

      {(street.length > 0 || cityState.length > 0 || trio.length > 0) && (
        <div className="space-y-5 border-t border-border/15 pt-6">
          <GroupCaption text={t('wizard.steps.locationZoning.sections.location.groups.address')} />
          {street.length > 0 && clusterGrid(street, ctx)}
          {cityState.length > 0 && clusterGrid(cityState, ctx)}
          {trio.length > 0 && <CompactFieldRow fields={trio} ctx={ctx} cols={3} />}
        </div>
      )}

      {rest.length > 0 && clusterGrid(rest, ctx)}
    </div>
  )
}

/* ── Zoning & Data Quality body: Classification → Coordinates/Geocode ── */

function ZoningBody(fields: FieldSchema[], ctx: ClusterContext, t: (key: string) => string) {
  const classification = pickFields(fields, CLASSIFICATION_KEYS)
  const coordinates = pickFields(fields, COORDINATE_KEYS)
  const rest = leftoverFields(fields, [CLASSIFICATION_KEYS, COORDINATE_KEYS])

  // Latitude/Longitude pair evenly (both .half()); Accuracy is the odd one
  // out. Now that this card is a half-width peer of Proximity & Views, its
  // own container rarely reaches the 3-up tier, so Accuracy would otherwise
  // sit alone at half width with dead space beside it — render it full
  // width instead (see fullWidthField()) rather than forcing a 3-column
  // layout this card's width can't comfortably support.
  const coordinatePair = coordinates.filter(f => f.key !== 'addressGeocodeType')
  const geocodeType = coordinates.find(f => f.key === 'addressGeocodeType')

  return (
    <div className="space-y-6">
      {classification.length > 0 && (
        <div>
          <GroupCaption text={t('wizard.steps.locationZoning.sections.zoningDataQuality.groups.classification')} />
          {clusterGrid(classification, ctx)}
        </div>
      )}

      {coordinates.length > 0 && (
        <div className={cn('space-y-5', classification.length > 0 && 'border-t border-border/15 pt-6')}>
          <GroupCaption text={t('wizard.steps.locationZoning.sections.zoningDataQuality.groups.coordinates')} />
          {coordinatePair.length > 0 && clusterGrid(coordinatePair, ctx)}
          {geocodeType && clusterGrid([fullWidthField(geocodeType)], ctx)}
        </div>
      )}

      {rest.length > 0 && clusterGrid(rest, ctx)}
    </div>
  )
}

/* ── Proximity & Views body: View → Distances cluster ─────────────────── */

function ProximityBody(fields: FieldSchema[], ctx: ClusterContext, t: (key: string) => string) {
  const view = pickFields(fields, VIEW_KEYS)
  const distances = pickFields(fields, DISTANCE_KEYS)
  const rest = leftoverFields(fields, [VIEW_KEYS, DISTANCE_KEYS])

  return (
    <div className="space-y-6">
      {/* Composition pass: `view` is a lone .half() field with no row peer
          here — same dead-space problem `addressGeocodeType` had above,
          fixed the same way (fullWidthField), not a schema change. */}
      {view.length > 0 && clusterGrid(view.map(fullWidthField), ctx)}

      {distances.length > 0 && (
        <div className={view.length > 0 ? 'border-t border-border/15 pt-6' : undefined}>
          <GroupCaption text={t('wizard.steps.locationZoning.sections.proximityViews.groups.distances')} />
          {clusterGrid(distances, ctx)}
        </div>
      )}

      {rest.length > 0 && clusterGrid(rest, ctx)}
    </div>
  )
}

/* ─── LocationZoningStepView ─────────────────────────────────────────── */

const KNOWN_SECTION_IDS = ['location', 'zoning-data-quality', 'proximity-views', 'land-details', 'contacts']

export function LocationZoningStepView({ schema, form }: LocationZoningStepViewProps) {
  const { t } = useTranslation('properties')
  const [fieldOptions, setFieldOptionsState] = useState<Record<string, FieldOption[]>>({})
  const setFieldOptions = useCallback((key: string, options: FieldOption[]) => {
    setFieldOptionsState(prev => ({ ...prev, [key]: options }))
  }, [])

  const [fieldOptionsLoading, setFieldOptionsLoadingState] = useState<Record<string, boolean>>({})
  const setFieldOptionsLoading = useCallback((key: string, loading: boolean) => {
    setFieldOptionsLoadingState(prev => ({ ...prev, [key]: loading }))
  }, [])

  const watchedValues = useWatch({ control: form.control }) as Record<string, unknown>
  useDependencyEngine(schema, form, setFieldOptions, setFieldOptionsLoading)

  const sections = schema.sections ?? []
  const location = sections.find(s => s.id === 'location')
  const zoning = sections.find(s => s.id === 'zoning-data-quality')
  const proximity = sections.find(s => s.id === 'proximity-views')
  const landDetails = sections.find(s => s.id === 'land-details')
  const contacts = sections.find(s => s.id === 'contacts')
  // Any section this view doesn't know about yet — rendered generically so
  // a future schema addition is never silently dropped.
  const extraSections = sections.filter(s => !KNOWN_SECTION_IDS.includes(s.id))

  const ctx: ClusterContext = { form, watchedValues, fieldOptions, fieldOptionsLoading }

  // Not a schema section — the Map has no form fields of its own, only a
  // first-class card header matching every other section's chrome. `fields`
  // stays empty; `renderBody` below supplies the actual content.
  const mapSection: SectionSchema = {
    id: 'address-map',
    titleKey: 'wizard.locationMap.title',
    descriptionKey: 'wizard.locationMap.description',
    icon: MapPinned,
    fields: [],
  }

  return (
    <DynamicFormContext.Provider value={{ permissions: [], fieldOptions, setFieldOptions, fieldOptionsLoading, setFieldOptionsLoading }}>
      <div className="space-y-5 sm:space-y-6">
        {location && (
          <SectionRenderer
            section={location}
            sectionIndex={0}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
            renderBody={fields => LocationBody(fields, ctx, t)}
          />
        )}

        {/* Zoning & Data Quality | Proximity & Views — peer cards, equal
            visual weight. Each keeps its own independent collapse/expand
            state — this is purely an outer layout wrapper (SectionRow,
            shared with Identity's Classification|Governance row) around two
            unmodified SectionRenderer calls. tier="md" (@2xl, ~672px
            container) is the same "genuinely has room for 2 columns" tier
            the rest of this engine already uses (see utils.ts) — below it
            the cards stack. */}
        {(zoning || proximity) && (
          <SectionRow tier="md">
            {zoning && (
              <SectionRenderer
                section={zoning}
                sectionIndex={1}
                form={form}
                watchedValues={watchedValues}
                fieldOptions={fieldOptions}
                fieldOptionsLoading={fieldOptionsLoading}
                permissions={[]}
                renderBody={fields => ZoningBody(fields, ctx, t)}
              />
            )}

            {proximity && (
              <SectionRenderer
                section={proximity}
                sectionIndex={2}
                form={form}
                watchedValues={watchedValues}
                fieldOptions={fieldOptions}
                fieldOptionsLoading={fieldOptionsLoading}
                permissions={[]}
                renderBody={fields => ProximityBody(fields, ctx, t)}
              />
            )}
          </SectionRow>
        )}

        {/* Land Details — its own full-width conditional chapter (Category =
            Land only), sitting between the two peer rows. Untouched: same
            SectionRenderer call as before, no renderBody override. */}
        {landDetails && (
          <SectionRenderer
            section={landDetails}
            sectionIndex={3}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
          />
        )}

        {extraSections.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            sectionIndex={4 + i}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
          />
        ))}

        {/* Contacts | Address & Map — Visual QA (F-03): a 4:8 sidebar row
            paired a single-field Contacts card against the much taller Map
            card, and items-start (correctly avoiding a stretched Contacts
            card) instead left a large bare-page gutter beside the short
            column. The height mismatch here is too extreme for any
            side-by-side split to read as balanced — both render full width,
            stacked, matching how Land Details and every extra section above
            already render. */}
        {contacts && (
          <SectionRenderer
            section={contacts}
            sectionIndex={5 + extraSections.length}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
          />
        )}

        <SectionRenderer
          section={mapSection}
          sectionIndex={6 + extraSections.length}
          form={form}
          watchedValues={watchedValues}
          fieldOptions={fieldOptions}
          fieldOptionsLoading={fieldOptionsLoading}
          permissions={[]}
          renderBody={() => <LocationMapPreview form={form} />}
        />
      </div>
    </DynamicFormContext.Provider>
  )
}
