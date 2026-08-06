'use client'

import { useMemo } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, XCircle, Info, CheckCircle2,
  Building2, MapPin, CircleDollarSign, Ruler, Wrench, Sparkles, Camera,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllFields, isFieldVisible, evaluateCondition, isFilled,
  type StepSchema, type FieldSchema, type FieldOption,
} from '@/framework/form-engine'
import { useFormFramework } from '@/components/form-framework'
import { SaveStateIndicator } from '@/components/form-framework/SaveStateIndicator'
import { getDataCompleteness } from '@/features/properties/lib/data-completeness'
import { buildPropertyHealth, buildMarketDemand } from '@/features/properties/lib/property-health'
import { useLocationCascadeNames } from '@/features/properties/hooks/usePropertyLocation'
import { CATEGORY_OPTIONS, REQUEST_TYPE_OPTIONS, SWIMMING_POOL_OPTIONS, GARAGE_OPTIONS } from '@/features/properties/domain/options'
import { getTypeOptionsForCategory } from '@/features/properties/domain/property-type.registry'
import { getStatusLabel } from '@/features/properties/components/PropertyStatusBadge'
import type { RealEstateProperty } from '@/features/properties/types/property.types'
import {
  ReviewCard, KeyValueRow, Chip, MetricBlock, ConfidenceItem, QualityIssueRow, QualityIssueGroup,
} from './review-primitives'

// ── Step 08: Review & Publish ────────────────────────────────────────────────
// Executive review workspace — the natural conclusion of Steps 01-07, not a
// standalone status dashboard. Reuses the exact same section chrome, card
// language, and completion-badge convention already established throughout
// the wizard (ReviewCard mirrors SectionRenderer's default card; completion
// counts reuse getAllFields/isFieldVisible, the same primitives every other
// step's SectionCompletionBadge is built from). Reuses the EXISTING
// completeness/health/demand scorers rather than inventing new business
// signals — see data-completeness.ts / property-health.ts's own "kept
// deliberately separate" rationale for why there are two scorers, not one.
//
// Four zones, top to bottom on desktop: Executive Summary -> Property Review
// (one ReviewCard per wizard step, each with an Edit action that jumps
// straight back to that step via the same goToStep() the stepper itself
// uses) -> Quality Center (the old warning banners, now actionable rows that
// link to the step that fixes them) -> Publish Decision (the final
// approval card). On mobile the brief calls for Quality Center to surface
// before the per-step cards (Summary -> Quality -> Review -> Publish) — done
// with plain responsive `order-*` utilities on a single flex column, so nothing
// is duplicated in the DOM for the two breakpoints.

interface ReviewStepProps {
  form: UseFormReturn<Record<string, unknown>>
  steps: StepSchema[]
  /** Agent options (same list identity-governance.schema.ts's assignedUserId
   *  select uses) — needed here purely to resolve the id already stored in
   *  the form back to a display name. */
  userOptions: FieldOption[]
}

function isCurrentlyRequired(field: FieldSchema, values: Record<string, unknown>): boolean {
  return !!field.required || (field.requiredWhen ? evaluateCondition(field.requiredWhen, values) : false)
}

/** How many of a whole step's currently-visible fields are filled — the same
 *  computation section-primitives.tsx's getSectionCompletion does for one
 *  section, extended across every section a step schema declares. Shares
 *  that same module's isFilled (imported above), not a local copy — a
 *  parallel `isEmpty` used to live here and had drifted out of sync with it
 *  (didn't know a switch/checkbox's `false` or rich-text's empty "<p></p>"
 *  don't count as filled). */
function getStepCompletion(step: StepSchema, values: Record<string, unknown>) {
  const fields = (getAllFields(step) as FieldSchema[]).filter(f => f.type !== 'hidden' && isFieldVisible(f.visibility, values))
  const filled = fields.filter(f => isFilled(values[f.key], f))
  return { filled: filled.length, total: fields.length }
}

function labelFor(options: FieldOption[], value: unknown, t: (key: string) => string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const match = options.find(o => String(o.value) === String(value))
  if (!match) return String(value)
  return match.labelKey ? t(match.labelKey) : match.label
}

/** Presentation-only formatting — turns a raw snake_case/lowercase enum
 *  value (e.g. cHeatingMedium's 'natural_gas') into a readable phrase for
 *  display. Never changes the underlying value, only how this read-only
 *  summary renders it. */
function humanize(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatCurrency(value: unknown): string | undefined {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return undefined
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function yesNo(value: unknown, t: (key: string) => string): string | undefined {
  if (typeof value !== 'boolean') return undefined
  return value ? t('common.yes') : t('common.no')
}

// English identifiers data-completeness.ts's `missing` array uses internally
// (also this file's own MISSING_TO_STEP lookup key) — translated only at
// display time, here and in PropertyPlaceholders.tsx's CompletenessBar, so
// the underlying identifiers never change.
const MISSING_FIELD_KEY: Record<string, string> = {
  Photos: 'photos',
  Price: 'price',
  Location: 'location',
  Specifications: 'specifications',
  Description: 'description',
  Agent: 'agent',
  'Property type': 'propertyType',
}

// Fixed, small vocabularies (data-completeness.ts's `missing` labels and
// property-health.ts's factor `id`s are both stable literal sets, not
// dynamic data) — mapped once to the wizard step index each gap belongs to,
// so the Quality Center's "Edit X" links always land on the right step.
const STEP = {
  identity: 0, location: 1, financial: 2, sizeRooms: 3,
  construction: 4, outdoor: 5, media: 6,
} as const

const MISSING_TO_STEP: Record<string, number> = {
  Photos: STEP.media,
  Price: STEP.financial,
  Location: STEP.location,
  Specifications: STEP.sizeRooms,
  Description: STEP.media,
  Agent: STEP.identity,
  'Property type': STEP.identity,
}

const FACTOR_TO_STEP: Record<string, number> = {
  media: STEP.media,
  price: STEP.financial,
  specs: STEP.sizeRooms,
  description: STEP.media,
  agent: STEP.identity,
  location: STEP.location,
}

export function ReviewStep({ form, steps, userOptions }: ReviewStepProps) {
  const { t } = useTranslation('properties')
  const { config, goToStep, saveState } = useFormFramework()
  const values = useWatch({ control: form.control }) as Record<string, unknown>

  // Cast through `unknown`: this is a deliberately sparse, in-progress draft,
  // not a full RealEstateProperty — safe because every scorer below
  // null-guards its own field access internally (confirmed by reading each
  // source).
  const draft = values as unknown as RealEstateProperty

  const completeness = useMemo(() => getDataCompleteness(draft), [draft])
  const health = useMemo(() => buildPropertyHealth(draft, t), [draft, t])
  const demand = useMemo(() => buildMarketDemand(draft, t), [draft, t])

  const cascade = useLocationCascadeNames({
    regionLocationId: values.regionLocationId as string | undefined,
    subRegionLocationId: values.subRegionLocationId as string | undefined,
    locationId: values.locationId as string | undefined,
  })

  const violations = useMemo(() => {
    const out: { label: string; stepIndex: number }[] = []
    steps.forEach((step, stepIndex) => {
      const fields = getAllFields(step) as FieldSchema[]
      for (const field of fields) {
        if (field.type === 'hidden') continue
        if (!isFieldVisible(field.visibility, values)) continue
        if (!isCurrentlyRequired(field, values)) continue
        if (!isFilled(values[field.key], field)) out.push({ label: field.labelKey ? t(field.labelKey) : field.key, stepIndex })
      }
    })
    return out
  }, [steps, values, t])

  const attentionFactors = health.factors.filter(f => f.status !== 'pass')
  const isReadyToPublish = violations.length === 0 && completeness.missing.length === 0

  const agentName = labelFor(userOptions, values.assignedUserId, t)
  const categoryLabel = labelFor(CATEGORY_OPTIONS, values.category, t)
  const requestLabel = labelFor(REQUEST_TYPE_OPTIONS, values.requestType, t)
  // Resolved against the exact same options list the wizard's own Property
  // Type select (identity-governance.schema.ts) reads from — category-scoped
  // and Title-Cased — so this card's label always matches what Step 1 itself
  // shows, rather than a generic (and here mismatched-case) type registry.
  const typeLabel = labelFor(getTypeOptionsForCategory(values.category as string | undefined), values.type, t)
  const regionLabel = cascade.regionLocationName
  const districtLabel = cascade.locationName || (values.addressCity as string | undefined)
  const photoCount = Array.isArray(values.imagesIds) ? values.imagesIds.length : 0

  // Publish Decision's confidence checklist — five plain booleans re-derived
  // from the scores/violations already computed above (getDataCompleteness/
  // buildPropertyHealth/buildMarketDemand, plus the required-field scan),
  // never a new scoring rule. Kept next to that data rather than in JSX so
  // the checklist and the metric numbers underneath it can never disagree
  // about what "ready" means.
  const isListingComplete = completeness.level === 'complete' || completeness.level === 'showcase'
  const isValidationPassed = violations.length === 0
  const isBuyerReady = health.grade === 'A' || health.grade === 'B'
  const isSearchReady = demand.level === 'high' || demand.level === 'very-high'

  return (
    <div className="flex flex-col gap-5 sm:gap-6">

      {/* ══════════════════════════════════════════════════════════════
          ZONE 1 — Executive Summary
      ══════════════════════════════════════════════════════════════ */}
      <ReviewCard
        icon={Building2}
        title={t('wizard.review.executiveSummary.title')}
        description={t('wizard.review.executiveSummary.description')}
        emphasis="strong"
      >
        {/* Identity line: title first, then the property's own "what/where
            for" statement — Property Type, Category, Request Type — as a
            visual anchor right under the name, before any metadata. Status,
            Reference Code and every other administrative fact stay out of
            this line entirely so the eye lands on commercial identity
            first, exactly as the brief asks. */}
        {/* @container, not a viewport breakpoint: this card can render at
            very different actual widths (sidebar open/collapsed, tablet
            with the nav rail still showing) that don't line up with the
            viewport size that would trigger `sm:` — confirmed live at
            768px viewport / ~550px actual card width, where a plain
            `sm:grid-cols-4` still fired and truncated "350,000 €" /
            "Κέντρο Αθήνας" into a too-narrow column. Same fix GridEngine
            already applies everywhere else in this wizard. */}
        <div className="@container">
          <div className="min-w-0">
            <h2 className="truncate text-[23px] font-extrabold tracking-tight text-foreground">
              {(values.title as string) || (values.propertyCode as string) || t('wizard.review.untitledProperty')}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {typeLabel && <Chip tone="positive">{typeLabel}</Chip>}
              {categoryLabel && <Chip>{categoryLabel}</Chip>}
              {requestLabel && <Chip>{requestLabel}</Chip>}
            </div>
          </div>

          {/* Primary anchors — the commercial identity: what it costs, how
              big it is, and where it is. These four are the only
              "primary"-weight facts in the card; everything else in this
              zone reads smaller, by design. */}
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 @2xl:grid-cols-4">
            <KeyValueRow label={t('wizard.review.fields.askingPrice')} value={formatCurrency(values.price)} weight="primary" />
            <KeyValueRow label={t('wizard.review.fields.totalArea')} value={values.square ? `${values.square} m²` : undefined} weight="primary" />
            <KeyValueRow label={t('wizard.review.fields.region')} value={regionLabel} weight="primary" />
            <KeyValueRow label={t('wizard.review.fields.district')} value={districtLabel} weight="primary" />
          </div>

          {/* Supporting facts — still commercially relevant, deliberately
              one typographic step down from the anchors above. */}
          <div className="mt-5 border-t border-border/15 pt-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 @2xl:grid-cols-4">
              <KeyValueRow value={values.bedroomCount != null ? t('wizard.review.fields.bedShort', { count: values.bedroomCount }) : undefined} />
              <KeyValueRow value={values.bathroomCount != null ? t('wizard.review.fields.bathShort', { count: values.bathroomCount }) : undefined} />
              <KeyValueRow label={t('wizard.review.fields.street')} value={values.addressStreet as string | undefined} />
              <KeyValueRow label={t('wizard.review.fields.agent')} value={agentName} />
            </div>
          </div>

          {/* Administrative metadata — reference, status, year, financial
              flags, and the two headline scores. Deliberately the quietest
              tier: it should never compete with what the property IS.
              flex-wrap, not a grid — a row of independently-sized chips of
              text has no "column" to truncate into at any width. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/15 pt-4">
            <KeyValueRow label={t('wizard.review.fields.status')} value={values.status ? getStatusLabel(values.status as string, t) : undefined} weight="muted" />
            <KeyValueRow label={t('wizard.review.fields.ref')} value={values.propertyCode as string | undefined} weight="muted" />
            <KeyValueRow label={t('wizard.review.fields.built')} value={values.yearBuilt as number | undefined} weight="muted" />
            <KeyValueRow label={t('wizard.review.fields.vat')} value={yesNo(values.vat as boolean | undefined, t)} weight="muted" />
            <KeyValueRow label={t('wizard.review.fields.investment')} value={yesNo(values.investment as boolean | undefined, t)} weight="muted" />
            <KeyValueRow label={t('wizard.review.fields.completion')} value={`${completeness.score}/100`} weight="muted" />
            <KeyValueRow label={t('wizard.review.fields.health')} value={`${health.score}/100 · ${health.grade}`} weight="muted" />
          </div>
        </div>
      </ReviewCard>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 3 — Quality Center (order swapped ahead of Zone 2 on mobile
          only, per the approved IA: "Summary -> Quality -> Review -> Publish"
          on small screens, "Summary -> Review -> Quality -> Publish" on
          desktop, both from this one flex column via order-*).
      ══════════════════════════════════════════════════════════════ */}
      <div className="order-2 flex flex-col gap-4 sm:order-3">
        {isReadyToPublish ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 px-4 py-3.5 text-[13px] font-medium text-emerald-700">
            <CheckCircle2 className="size-4 shrink-0" />
            {t('wizard.review.readyToPublish')}
          </div>
        ) : (
          // @container/@md: same truncation-avoidance fix as the Executive
          // Summary above — this row of QualityIssueGroup cards can render
          // narrower than its viewport width would suggest.
          <div className="@container">
            <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
              {completeness.missing.length > 0 && (
                <QualityIssueGroup icon={AlertTriangle} tone="warning" title={t('wizard.review.missingInformation')} count={completeness.missing.length}>
                  {completeness.missing.map(label => (
                    <QualityIssueRow
                      key={label}
                      label={t(`wizard.review.missingFields.${MISSING_FIELD_KEY[label] ?? label}`)}
                      stepLabel={config.steps[MISSING_TO_STEP[label] ?? STEP.identity]?.title ?? t('wizard.review.stepFallback')}
                      onClick={() => goToStep(MISSING_TO_STEP[label] ?? STEP.identity)}
                    />
                  ))}
                </QualityIssueGroup>
              )}

              {violations.length > 0 && (
                <QualityIssueGroup icon={XCircle} tone="destructive" title={t('wizard.review.requiredFieldsNotFilled')} count={violations.length}>
                  {violations.map((v, i) => (
                    <QualityIssueRow
                      key={`${v.label}-${i}`}
                      label={v.label}
                      stepLabel={config.steps[v.stepIndex]?.title ?? t('wizard.review.stepFallback')}
                      onClick={() => goToStep(v.stepIndex)}
                    />
                  ))}
                </QualityIssueGroup>
              )}

              {attentionFactors.length > 0 && (
                <QualityIssueGroup icon={Info} tone="neutral" title={t('wizard.review.needsAttention')} count={attentionFactors.length}>
                  {attentionFactors.map(f => (
                    <QualityIssueRow
                      key={f.id}
                      label={f.note ?? f.label}
                      stepLabel={config.steps[FACTOR_TO_STEP[f.id] ?? STEP.identity]?.title ?? t('wizard.review.stepFallback')}
                      onClick={() => goToStep(FACTOR_TO_STEP[f.id] ?? STEP.identity)}
                    />
                  ))}
                </QualityIssueGroup>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 2 — Property Review (one ReviewCard per wizard step)
      ══════════════════════════════════════════════════════════════ */}
      <div className="order-3 @container sm:order-2">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
          <ReviewCard
            icon={Building2}
            title={config.steps[STEP.identity]?.title ?? t('wizard.page.steps.identity.title')}
            completion={getStepCompletion(steps[STEP.identity], values)}
            onEdit={() => goToStep(STEP.identity)}
            emphasis="strong"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.propertyType')} value={typeLabel} weight="primary" />
              <KeyValueRow label={t('wizard.review.fields.category')} value={categoryLabel} weight="primary" />
              <KeyValueRow label={t('wizard.review.fields.request')} value={requestLabel} />
              <KeyValueRow label={t('wizard.review.fields.status')} value={values.status ? getStatusLabel(values.status as string, t) : undefined} />
            </div>
          </ReviewCard>

          <ReviewCard
            icon={MapPin}
            title={config.steps[STEP.location]?.title ?? t('wizard.page.steps.location.title')}
            completion={getStepCompletion(steps[STEP.location], values)}
            onEdit={() => goToStep(STEP.location)}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.region')} value={cascade.regionLocationName} />
              <KeyValueRow label={t('wizard.review.fields.district')} value={cascade.locationName} />
              <KeyValueRow label={t('wizard.review.fields.street')} value={values.addressStreet as string | undefined} className="col-span-2" />
            </div>
          </ReviewCard>

          <ReviewCard
            icon={CircleDollarSign}
            title={config.steps[STEP.financial]?.title ?? t('wizard.page.steps.financial.title')}
            completion={getStepCompletion(steps[STEP.financial], values)}
            onEdit={() => goToStep(STEP.financial)}
            emphasis="strong"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.askingPrice')} value={formatCurrency(values.price)} weight="primary" className="col-span-2" />
              <KeyValueRow label={t('wizard.review.fields.vat')} value={yesNo(values.vat as boolean | undefined, t)} />
              <KeyValueRow label={t('wizard.review.fields.investment')} value={yesNo(values.investment as boolean | undefined, t)} />
            </div>
          </ReviewCard>

          <ReviewCard
            icon={Ruler}
            title={config.steps[STEP.sizeRooms]?.title ?? t('wizard.page.steps.sizeRoomsStructure.title')}
            completion={getStepCompletion(steps[STEP.sizeRooms], values)}
            onEdit={() => goToStep(STEP.sizeRooms)}
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.totalArea')} value={values.square ? `${values.square} m²` : undefined} weight="primary" />
              <KeyValueRow value={values.bedroomCount != null ? t('wizard.review.fields.bedShort', { count: values.bedroomCount }) : undefined} weight="primary" />
              <KeyValueRow value={values.bathroomCount != null ? t('wizard.review.fields.bathShort', { count: values.bathroomCount }) : undefined} weight="primary" />
            </div>
          </ReviewCard>

          <ReviewCard
            icon={Wrench}
            title={config.steps[STEP.construction]?.title ?? t('wizard.page.steps.constructionSystems.title')}
            completion={getStepCompletion(steps[STEP.construction], values)}
            onEdit={() => goToStep(STEP.construction)}
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.built')} value={values.yearBuilt as number | undefined} />
              <KeyValueRow label={t('wizard.review.fields.heating')} value={humanize(values.cHeatingMedium)} />
              <KeyValueRow label={t('wizard.review.fields.energyClass')} value={values.energyClass as string | undefined} />
            </div>
          </ReviewCard>

          <ReviewCard
            icon={Sparkles}
            title={config.steps[STEP.outdoor]?.title ?? t('wizard.page.steps.features.title')}
            completion={getStepCompletion(steps[STEP.outdoor], values)}
            onEdit={() => goToStep(STEP.outdoor)}
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.balcony')} value={yesNo(values.balcony as boolean | undefined, t)} />
              <KeyValueRow label={t('wizard.review.fields.pool')} value={labelFor(SWIMMING_POOL_OPTIONS, values.swimmingPool, t)} />
              <KeyValueRow label={t('wizard.review.fields.garage')} value={labelFor(GARAGE_OPTIONS, values.garage, t)} />
            </div>
          </ReviewCard>

          <ReviewCard
            icon={Camera}
            title={config.steps[STEP.media]?.title ?? t('wizard.page.steps.media.title')}
            completion={getStepCompletion(steps[STEP.media], values)}
            onEdit={() => goToStep(STEP.media)}
            className="@2xl:col-span-2"
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-3.5">
              <KeyValueRow label={t('wizard.review.fields.featured')} value={yesNo(values.isFeatured as boolean | undefined, t)} />
              <KeyValueRow label={t('wizard.review.fields.photos')} value={photoCount} />
              <KeyValueRow
                label={t('wizard.review.fields.description')}
                value={typeof values.description === 'string' && values.description.trim() ? t('wizard.review.fields.descriptionCompleted') : t('wizard.review.fields.descriptionMissing')}
              />
            </div>
          </ReviewCard>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 4 — Publish Decision
      ══════════════════════════════════════════════════════════════ */}
      <ReviewCard
        icon={ShieldCheck}
        title={t('wizard.review.publishDecision.title')}
        description={t('wizard.review.publishDecision.description')}
        className="order-4"
        emphasis="strong"
      >
        {/* Primary message: confidence, not numbers. Five plain pass/fail
            confirmations — re-derived from the exact same scores/violations
            computed above, nothing new — read first and largest, so the
            page answers "am I ready?" before it shows any metric. */}
        {/* flex-wrap, not a grid: 5 items never divide evenly into equal
            columns, and a grid would strand the last one alone with dead
            space beside it (confirmed live). Each item keeps its own
            natural width instead, so the wrap point is just "the row
            ends," not an empty cell. */}
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          <ConfidenceItem label={t('wizard.review.confidence.listingComplete')} pass={isListingComplete} />
          <ConfidenceItem label={t('wizard.review.confidence.readyForPublication')} pass={isReadyToPublish} />
          <ConfidenceItem label={t('wizard.review.confidence.validationPassed')} pass={isValidationPassed} />
          <ConfidenceItem label={t('wizard.review.confidence.buyerReady')} pass={isBuyerReady} />
          <ConfidenceItem label={t('wizard.review.confidence.searchReady')} pass={isSearchReady} />
        </div>

        {/* Supporting detail: the same four scores, now visibly secondary
            (smaller scale, quieter caption) beneath the confirmations that
            actually answer "can I publish?". @container/@md, same
            truncation-avoidance reasoning as the Executive Summary above. */}
        <div className="@container mt-5 border-t border-border/15 pt-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 @md:grid-cols-4">
            <MetricBlock
              size="sm"
              label={t('wizard.review.listingHealth')}
              value={health.score}
              suffix={`/100 · ${health.grade}`}
              tone={health.grade === 'A' ? 'positive' : health.grade === 'D' ? 'destructive' : 'neutral'}
            />
            <MetricBlock
              size="sm"
              label={t('wizard.review.dataCompleteness')}
              value={completeness.score}
              suffix={`/100 · ${completeness.level}`}
              tone={completeness.level === 'showcase' || completeness.level === 'complete' ? 'positive' : 'neutral'}
            />
            <MetricBlock
              size="sm"
              label={t('wizard.review.metrics.buyerReadiness')}
              value={t(`wizard.review.buyerReadinessLevels.${
                completeness.level === 'showcase' ? 'high' : completeness.level === 'complete' ? 'good' : completeness.level === 'partial' ? 'fair' : 'low'
              }`)}
              tone={completeness.level === 'showcase' || completeness.level === 'complete' ? 'positive' : completeness.level === 'partial' ? 'warning' : 'destructive'}
            />
            <MetricBlock
              size="sm"
              label={t('wizard.review.metrics.searchVisibility')}
              value={demand.label}
              tone={demand.level === 'very-high' || demand.level === 'high' ? 'positive' : demand.level === 'medium' ? 'warning' : 'neutral'}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <SaveStateIndicator state={saveState} />
        </div>

        {/* State-aware microcopy — reuses the same violations/missing counts
            the Quality Center already computed, never a new check. */}
        <p className="mt-5 text-center text-[12.5px] text-muted-foreground/60">
          {isReadyToPublish
            ? 'This listing is ready — publishing will make it visible to your team.'
            : `You can still publish, but ${violations.length + completeness.missing.length} item${violations.length + completeness.missing.length === 1 ? '' : 's'} above could use attention first.`}
        </p>

        {/* Real submit trigger, not a duplicate action: this clicks the
            same primary CTA button already rendered in the sticky
            FormActionBar (identified via the shared `data-ff-submit-trigger`
            attribute added there) — so this button inherits the exact same
            disabled/loading/validation guard the action bar's own button
            already enforces, with zero submit logic duplicated here. */}
        <button
          type="button"
          onClick={() => {
            const trigger = Array.from(
              document.querySelectorAll<HTMLButtonElement>('[data-ff-submit-trigger]'),
            ).find(el => el.offsetParent !== null)
            trigger?.click()
          }}
          className={cn(
            'mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[13.5px] font-semibold tracking-[0.01em] text-primary-foreground',
            'bg-primary shadow-design-md transition-shadow duration-200 hover:shadow-design-lg',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20',
          )}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          {config.submitLabel ?? `Create ${config.entityLabel ?? 'Property'}`}
        </button>
      </ReviewCard>
    </div>
  )
}
