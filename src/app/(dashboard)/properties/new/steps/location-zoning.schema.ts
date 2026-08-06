import { MapPin, Landmark, LandPlot, Users, Compass } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema, FieldOption, FieldSchema } from '@/framework/form-engine'
import { NO_BAD_CHARACTERS_PATTERN, CITY_MAX_LENGTH, POSTAL_CODE_MAX_LENGTH, COUNTRY_MAX_LENGTH, CLOSE_TO_MAX_LENGTH, STREET_MAX_LENGTH, STATE_MAX_LENGTH } from '@/features/properties/domain/validation'
import { GEOCODE_TYPE_OPTIONS, BELT_OPTIONS, SLOPE_OPTIONS, VIEW_OPTIONS } from '@/features/properties/domain/options'
import { LAND_CATEGORY } from '@/features/properties/domain/visibility'
import { fetchChildLocations } from '@/features/properties/repositories/real-estate-location.repository'

async function loadChildLocationOptions(parentId: string): Promise<FieldOption[]> {
  const rows = await fetchChildLocations(parentId)
  return rows.map(row => ({ value: row.id, label: row.name }))
}

// ── Step 2: Location & Zoning ───────────────────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 3 (content), revised
// post-launch to fix a real defect: the original regionLocationName/
// subRegionLocationName/locationName free-text fields wrote to attributes
// that do not exist on the real RealEstateProperty entity (confirmed via
// live EspoCRM metadata) — they accepted input and submitted without error,
// but nothing ever persisted, because the real backend only has three
// `belongsTo` relationship fields to a self-referencing RealEstateLocation
// entity: regionLocation (optional), subRegionLocation (required), and
// location (required — the exact field that blocked every Create submission
// found in the Final Release Report). Replaced with a working Region -> Sub
// Region -> Location cascade against that real relationship.
//
// Address Business Group, Phase 2 (2026-07-12) — canonicalization decision
// resolved: the live entity carries two parallel address composites,
// `address` (addressCity/addressPostalCode/addressCountry/... — this step)
// and a custom `cLocationReal*` set never exposed anywhere in this wizard.
// Evidence, all live: (1) EspoCRM's own native list-map feature is enabled
// (clientDefs.listMapViewEnabled: true) and explicitly configured to read
// `listMapAddressField: "address"` — the platform's own admin-configured UI
// already depends on this composite, not cLocationReal. (2) `cLocationReal`
// has zero references anywhere in clientDefs (no panel, layout, or list
// config names it) — nothing in EspoCRM's own UI surfaces it. (3)
// addressLatitude/addressLongitude round-trip correctly (live-confirmed);
// cLocationRealLatitude/cLocationRealLongitude do not — the PATCH returns
// 200 but the value never persists, an unexplained platform defect (Business
// Group Audit, §5.4). `address` is therefore canonical. `cLocationRealCity`
// remains required server-side regardless — outside this app's control — so
// property-form.transform.ts still mirrors addressCity into it, now
// documented as a permanent, intentional shadow-write, not open technical
// debt awaiting a decision. No other cLocationReal* field is written.

// regionOptions: top-level Regions, fetched once via the shared resource
// registry (useRegionLocations()) and passed in — same pattern as
// buildIdentityGovernanceStep's statusOptions/userOptions. Sub Region and
// Location have no such prop: their options are entirely parentId-driven,
// loaded through the dependency engine's reload-options mechanism (the same
// mechanism identity-governance.schema.ts's `type` field already uses for
// its category dependency).
const S = 'wizard.steps.locationZoning.sections'

export function buildLocationZoningStep(regionOptions: FieldOption[], contactOptions: FieldOption[]): StepSchema {
  return {
    sections: [
      section({
        id: 'location',
        titleKey: `${S}.location.title`,
        descriptionKey: `${S}.location.description`,
        icon: MapPin,
      }).fields([
        // Top level of the cascade — no parent, no dependency. Optional per
        // the real backend's `regionLocation` field (required: false).
        field.select('regionLocationId', `${S}.location.fields.regionLocationId.label`)
          .half()
          .placeholder(`${S}.location.fields.regionLocationId.placeholder`)
          .options(regionOptions)
          .clearable()
          .helperText(`${S}.location.fields.regionLocationId.helperText`)
          .build(),
        // Required per the real backend's `subRegionLocation` field.
        // Read-only (per the EspoCRM Dynamic Logic export's readOnly rule,
        // keyed on regionLocationId being empty — not .disabled(), which
        // stood in for this before the mechanisms were reconciled) until a
        // Region is chosen; reloads its option list from
        // that Region's children whenever regionLocationId changes (also
        // clears itself if its current value isn't among the freshly loaded
        // children — e.g. after the parent Region changes — the same
        // safe-for-edit-mode-prefill behavior already proven by `type`'s
        // dependency on `category`).
        {
          ...field.select('subRegionLocationId', `${S}.location.fields.subRegionLocationId.label`)
            .required()
            .half()
            .placeholder(`${S}.location.fields.subRegionLocationId.placeholder`)
            .readOnlyWhen({ field: 'regionLocationId', operator: 'empty' })
            .build(),
          dependencies: [{
            on: 'regionLocationId',
            action: 'reload-options',
            loadOptions: async regionId => loadChildLocationOptions(String(regionId ?? '')),
          }],
        } as FieldSchema,
        // Required per the real backend's `location` field — the same field
        // that blocked every Create submission before this fix. Read-only
        // until a Sub-Region is chosen; reloads from that Sub-Region's
        // children.
        {
          ...field.select('locationId', `${S}.location.fields.locationId.label`)
            .required()
            .half()
            .placeholder(`${S}.location.fields.locationId.placeholder`)
            .readOnlyWhen({ field: 'subRegionLocationId', operator: 'empty' })
            .build(),
          dependencies: [{
            on: 'subRegionLocationId',
            action: 'reload-options',
            loadOptions: async subRegionId => loadChildLocationOptions(String(subRegionId ?? '')),
          }],
        } as FieldSchema,
        // Address Business Group, Phase 2. entityDefs: { type: 'text',
        // maxLength: 255 }. Not required live; no PDF/DL coverage (Business
        // Group Audit, §2 — evidence gap disclosed there).
        // Placeholder example ("Syntagma Square") is a real place name, in
        // the same never-translate bucket as City/Country/Address values —
        // its en/el entries are intentionally identical (only the "e.g."
        // wrapper text differs).
        field.text('addressStreet', `${S}.location.fields.addressStreet.label`)
          .full()
          .placeholder(`${S}.location.fields.addressStreet.placeholder`)
          .maxLength(STREET_MAX_LENGTH)
          .build(),
        // PDF: Required: No. Required client-side since the Phase 0
        // Production Hotfix (2026-07-12): cLocationRealCity is required
        // server-side and outside this app's control, and this field is its
        // permanent source (see the file header comment) — not a temporary
        // bridge awaiting a decision anymore, that decision is resolved.
        field.text('addressCity', `${S}.location.fields.addressCity.label`)
          .required()
          .half()
          .placeholder(`${S}.location.fields.addressCity.placeholder`)
          .maxLength(CITY_MAX_LENGTH)
          .validate([{
            type: 'pattern',
            regex: NO_BAD_CHARACTERS_PATTERN,
            message: 'City contains invalid characters',
          }])
          .build(),
        // Address Business Group, Phase 2. entityDefs: { type: 'varchar',
        // maxLength: 100 }. Closest live field to the requested "County" —
        // no field named County exists anywhere (Business Group Audit, §1);
        // labeled to make that mapping visible rather than silently assumed.
        field.text('addressState', `${S}.location.fields.addressState.label`)
          .half()
          .placeholder(`${S}.location.fields.addressState.placeholder`)
          .maxLength(STATE_MAX_LENGTH)
          .validate([{
            type: 'pattern',
            regex: NO_BAD_CHARACTERS_PATTERN,
            message: 'State / County contains invalid characters',
          }])
          .build(),
        // PDF's "Validation Pattern: addressPostalCode" is not a known/existing
        // pattern anywhere in this project — no regex implemented here per the
        // PDF's explicit instruction not to invent one. Flagged as a blocker in
        // the task output. Max length is still applied.
        field.text('addressPostalCode', `${S}.location.fields.addressPostalCode.label`)
          .half()
          .placeholder(`${S}.location.fields.addressPostalCode.placeholder`)
          .maxLength(POSTAL_CODE_MAX_LENGTH)
          .build(),
        field.text('addressCountry', `${S}.location.fields.addressCountry.label`)
          .half()
          .placeholder(`${S}.location.fields.addressCountry.placeholder`)
          .maxLength(COUNTRY_MAX_LENGTH)
          .validate([{
            type: 'pattern',
            regex: NO_BAD_CHARACTERS_PATTERN,
            message: 'Country contains invalid characters',
          }])
          .build(),
        // PDF: Maximum Length 255, no validation pattern, no dynamic logic.
        field.text('closeTo', `${S}.location.fields.closeTo.label`)
          .half()
          .placeholder(`${S}.location.fields.closeTo.placeholder`)
          .maxLength(CLOSE_TO_MAX_LENGTH)
          .build(),
      ]),

      section({
        id: 'zoning-data-quality',
        titleKey: `${S}.zoningDataQuality.title`,
        descriptionKey: `${S}.zoningDataQuality.description`,
        icon: Landmark,
        collapsible: true,
        defaultCollapsed: true,
      }).fields([
        // PDF defines no dynamic logic for this field — always visible, never
        // required, no validation.
        field.select('belt', `${S}.zoningDataQuality.fields.belt.label`)
          .half()
          .placeholder(`${S}.zoningDataQuality.fields.belt.placeholder`)
          .options(BELT_OPTIONS)
          .build(),
        // Relocated from identity.schema.ts (Step1 · Status & Assignment) —
        // spec §02: a zoning/legal fact about the land, not a
        // listing-governance fact about the record. No dynamic logic, never
        // required, no validation — unchanged from its prior definition.
        field.switch('withinCityPlan', `${S}.zoningDataQuality.fields.withinCityPlan.label`)
          .half()
          .build(),
        // Address Business Group, Phase 2. entityDefs: { type: 'float',
        // isMatching: true } — no min/max declared for either field, so none
        // is invented here (Metadata Gate — a constraint is only added when
        // the live source declares one). Plain number inputs, manually
        // entered — no map picker, no geocoding lookup; that is explicitly
        // out of scope for this phase (Google Maps / Places Autocomplete).
        field.number('addressLatitude', `${S}.zoningDataQuality.fields.addressLatitude.label`)
          .half()
          .step(0.000001)
          .placeholder(`${S}.zoningDataQuality.fields.addressLatitude.placeholder`)
          .helperText(`${S}.zoningDataQuality.fields.addressLatitude.helperText`)
          .build(),
        field.number('addressLongitude', `${S}.zoningDataQuality.fields.addressLongitude.label`)
          .half()
          .step(0.000001)
          .placeholder(`${S}.zoningDataQuality.fields.addressLongitude.placeholder`)
          .helperText(`${S}.zoningDataQuality.fields.addressLongitude.helperText`)
          .build(),
        field.select('addressGeocodeType', `${S}.zoningDataQuality.fields.addressGeocodeType.label`)
          .half()
          .placeholder(`${S}.zoningDataQuality.fields.addressGeocodeType.placeholder`)
          .options(GEOCODE_TYPE_OPTIONS)
          .build(),
      ]),

      // Proximity & Views — Wave 5 (2026-07-15, Rooms, Measurements, Views &
      // Distances). 5 real fields with no dynamic logic (always visible),
      // confirmed live this session. No unit (km/m) is declared anywhere in
      // the live metadata for the 4 distance fields, so none is invented in
      // the label — see the Wave 5 Pre-Implementation Verification's
      // Metadata Gate discipline.
      section({
        id: 'proximity-views',
        titleKey: `${S}.proximityViews.title`,
        descriptionKey: `${S}.proximityViews.description`,
        icon: Compass,
        collapsible: true,
        defaultCollapsed: true,
      }).fields([
        field.select('view', `${S}.proximityViews.fields.view.label`)
          .half()
          .placeholder(`${S}.proximityViews.fields.view.placeholder`)
          .options(VIEW_OPTIONS)
          .build(),
        field.number('distanceFromSea', `${S}.proximityViews.fields.distanceFromSea.label`)
          .quarter()
          .build(),
        field.number('distanceFromCity', `${S}.proximityViews.fields.distanceFromCity.label`)
          .quarter()
          .build(),
        field.number('distanceFromVillage', `${S}.proximityViews.fields.distanceFromVillage.label`)
          .quarter()
          .build(),
        field.number('distanceFromAirport', `${S}.proximityViews.fields.distanceFromAirport.label`)
          .quarter()
          .build(),
      ]),

      // Land Details — Business Group, completed 2026-07-12. The Dynamic
      // Logic export defines 14 fields visible only when Category = Land
      // (Missing Metadata Register Group 1); none existed anywhere in this
      // codebase because no source available until this session gave their
      // type. Live EspoCRM entityDefs (queried directly this session) now
      // confirms every field's real type, options, min/max, and default —
      // all 14 share the identical visibility rule, section, payload
      // behavior, and regression scope, so all 14 are implemented together
      // per the Business-Group implementation strategy. None of the 14
      // appear in the PDF at all, so no field here has a PDF-given label —
      // every label below is a plain, literal reading of the attribute
      // name, same precedent as hasElectricalDevices' humanization (CR-10).
      // None carry a `required` rule in the Dynamic Logic export or live
      // metadata (the Boolean fields' `notNull: true` is a storage-default
      // constraint, not a UI-required rule — no other Boolean field in this
      // entity is marked required for the same reason).
      //
      // visibleWhen is set on every field here too, redundant with the
      // section's own visibility — see the cBuildingBlocks note this
      // pattern originates from: ReviewStep.tsx's completeness scan checks
      // field-level visibility only, not the parent section's.
      section({
        id: 'land-details',
        titleKey: `${S}.landDetails.title`,
        descriptionKey: `${S}.landDetails.description`,
        icon: LandPlot,
        collapsible: true,
        defaultCollapsed: true,
        visibility: LAND_CATEGORY,
      }).fields([
        // entityDefs: { type: 'int', required: false } — no min/max declared.
        field.number('cBuildingBlocks', `${S}.landDetails.fields.cBuildingBlocks.label`)
          .quarter()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'int' } — no min/max declared.
        field.number('cFrontLength', `${S}.landDetails.fields.cFrontLength.label`)
          .quarter()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'int' } — no min/max declared.
        field.number('cHeightFactor', `${S}.landDetails.fields.cHeightFactor.label`)
          .quarter()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'int' } — no min/max declared. isCustom:false
        // (unlike its 13 siblings here) — a standard EspoCRM field, not a
        // custom one; no behavioral difference for this wizard either way.
        field.number('cRemainingBuild', `${S}.landDetails.fields.cRemainingBuild.label`)
          .quarter()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'int' } — no min/max declared.
        field.number('cBuildingFactor', `${S}.landDetails.fields.cBuildingFactor.label`)
          .quarter()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'float', default: 0.1, min: 0.1, max: 10 }.
        // step(0.1) matches the granularity the metadata's own min/default
        // already express (0.1) — not an invented precision.
        field.number('cCoverageFactor', `${S}.landDetails.fields.cCoverageFactor.label`)
          .quarter().min(0.1).max(10).step(0.1).default(0.1)
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'float', min: 0.1, max: 5 } — no default given
        // (unlike cCoverageFactor), so none is invented here.
        field.number('cStructureFactor', `${S}.landDetails.fields.cStructureFactor.label`)
          .quarter().min(0.1).max(5).step(0.1)
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'bool', notNull: true }.
        field.switch('cCityplan', `${S}.landDetails.fields.cCityplan.label`)
          .half()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        field.switch('cResidentialArea', `${S}.landDetails.fields.cResidentialArea.label`)
          .half()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        field.switch('cFacade', `${S}.landDetails.fields.cFacade.label`)
          .half()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        field.switch('cBuildingPermit', `${S}.landDetails.fields.cBuildingPermit.label`)
          .half()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        field.switch('cAgriculturalUse', `${S}.landDetails.fields.cAgriculturalUse.label`)
          .half()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        field.switch('cContainsBuilding', `${S}.landDetails.fields.cContainsBuilding.label`)
          .half()
          .visibleWhen(LAND_CATEGORY)
          .build(),
        // entityDefs: { type: 'enum', options: ['', 'plane', 'inclining',
        // 'amphitheatric'] } — see SLOPE_OPTIONS' own comment for why the
        // blank option is excluded.
        // Composition pass: trailing field after 6 even .half() switches —
        // .full() removes the dead half-row space a lone .half() control
        // would otherwise leave. Presentation-only.
        field.select('cSlope', `${S}.landDetails.fields.cSlope.label`)
          .full()
          .placeholder(`${S}.landDetails.fields.cSlope.placeholder`)
          .options(SLOPE_OPTIONS)
          .clearable()
          .visibleWhen(LAND_CATEGORY)
          .build(),
      ]),

      // Contacts — Business Group, Phase 1 (completed 2026-07-12; Phase 0
      // Production Hotfix superseded). Live entityDefs: `contacts`
      // (linkMultiple -> Contact, required: true), written via the
      // `contactsIds` REST attribute — the same <link>Ids convention already
      // used for assignedUserId/locationId. No Dynamic Logic rule exists for
      // this field (Contacts & Property Location Business Group Audit, §3).
      // Options sourced from the shared resource registry's `contacts` list
      // (useContacts()) — the same static-list pattern already proven for
      // Region — chosen over a live-search field.relation() per the audit's
      // §6.2 Option A (smallest diff, zero new endpoints). Capped at 200
      // contacts; no search-as-you-type. The per-contact `role` column
      // (contactsColumns, options sourced from Contact.propertyRole) has no
      // existing form-engine UI pattern (audit §10) and is deliberately
      // deferred, not part of this phase.
      section({
        id: 'contacts',
        titleKey: `${S}.contacts.title`,
        descriptionKey: `${S}.contacts.description`,
        icon: Users,
      }).fields([
        field.multiSelect('contactsIds', `${S}.contacts.fields.contactsIds.label`)
          .required()
          .full()
          .placeholder(`${S}.contacts.fields.contactsIds.placeholder`)
          .options(contactOptions)
          .helperText(`${S}.contacts.fields.contactsIds.helperText`)
          .build(),
      ]),
    ],
  }
}
