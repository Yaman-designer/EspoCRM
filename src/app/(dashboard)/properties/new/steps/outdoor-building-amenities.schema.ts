import { TreePine, Compass, Building2, Sparkles } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema } from '@/framework/form-engine'
import { NOT_LAND_CATEGORY } from '@/features/properties/domain/visibility'
import { SWIMMING_POOL_OPTIONS, ACCESS_FROM_OPTIONS, ORIENTATION_OPTIONS, GARAGE_OPTIONS } from '@/features/properties/domain/options'

// ── Step 6: Outdoor, Building & Amenities ───────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 5. 14 fields: 8 native to
// features.schema.ts (migrated verbatim — this fully drains that file, no
// "-legacy" holding step needed for it, same pattern as Phase 3's
// location.schema.ts), 4 arriving from specifications.schema.ts (this fully
// drains specifications-legacy too), and 2 arriving from identity.schema.ts
// (idealForStudents/idealForEmployees, shrinking identity-legacy further).
//
// `garage` here and `cGarage` (construction-systems.schema.ts, Phase 4) are
// deliberately distinct fields, cross-referenced by helper text in both
// directions rather than merged — per spec §14's explicit UX mitigation for
// the Audit's documented confusion risk.

const S = 'wizard.steps.outdoorBuildingAmenities.sections'

// cPlacement's values are preserved exactly, including the deliberate
// duplicate — 'airy' and 'Clear' are distinct values that both display the
// same label (Greek "Διαμπερές", English "Airy") — not merged or
// deduplicated. Field's canonical PDF/entityDefs name is Greek
// ("Χωροθέτηση"); `label` below is the English fallback, and `labelKey` is
// what actually renders per active locale — see properties.json's
// wizard.steps.outdoorBuildingAmenities.sections.positionExposure.fields.
// cPlacement.options.* (el keeps this exact Greek text, unchanged).
const CPLACEMENT_OPTIONS_KEY = `${S}.positionExposure.fields.cPlacement.options`
const CPLACEMENT_OPTIONS = [
  { value: 'airy',             label: 'Airy',             labelKey: `${CPLACEMENT_OPTIONS_KEY}.airy` },
  { value: 'painted',          label: 'Painted',          labelKey: `${CPLACEMENT_OPTIONS_KEY}.painted` },
  { value: 'corner',           label: 'Corner',           labelKey: `${CPLACEMENT_OPTIONS_KEY}.corner` },
  { value: 'Facade',           label: 'Facade',           labelKey: `${CPLACEMENT_OPTIONS_KEY}.facade` },
  { value: 'Interior',         label: 'Interior',         labelKey: `${CPLACEMENT_OPTIONS_KEY}.interior` },
  { value: 'forCommercialUse', label: 'For Commercial Use', labelKey: `${CPLACEMENT_OPTIONS_KEY}.forCommercialUse` },
  { value: 'Side',             label: 'Side',             labelKey: `${CPLACEMENT_OPTIONS_KEY}.side` },
  { value: 'Clear',            label: 'Airy',             labelKey: `${CPLACEMENT_OPTIONS_KEY}.airy` },
  { value: 'bright',           label: 'Bright',           labelKey: `${CPLACEMENT_OPTIONS_KEY}.bright` },
  { value: 'Three-sided',      label: 'Three-Sided',      labelKey: `${CPLACEMENT_OPTIONS_KEY}.threeSided` },
  { value: 'Four-sided',       label: 'Four-Sided',       labelKey: `${CPLACEMENT_OPTIONS_KEY}.fourSided` },
]

export const outdoorBuildingAmenitiesSchema: StepSchema = {
  sections: [
    section({ id: 'outdoor-space', titleKey: `${S}.outdoorSpace.title`, icon: TreePine }).fields([
      // Reconciled from a 4-value descriptive select to the PDF's true
      // Boolean type. Visibility Category ≠ Land.
      // Composition pass: .third() (was .half()) across this trio — for
      // Category ≠ Land all 3 are visible together, which as an odd count
      // of .half() fields always stranded the third; .third() lets them
      // complete a clean 3-up row once the container has room.
      field.switch('balcony', `${S}.outdoorSpace.fields.balcony.label`)
        .third()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // PDF-exact order/values/labels. No category gate — a demand signal
      // that stays visible regardless of category.
      field.select('swimmingPool', `${S}.outdoorSpace.fields.swimmingPool.label`)
        .third()
        .options(SWIMMING_POOL_OPTIONS)
        .clearable()
        .build(),
      // PDF-exact order/values/labels, incl. deliberately spaced values
      // ('Dirt road', 'No access') — preserved exactly.
      field.select('accessFrom', `${S}.outdoorSpace.fields.accessFrom.label`)
        .third()
        .options(ACCESS_FROM_OPTIONS)
        .clearable()
        .build(),
    ]),

    section({ id: 'position-exposure', titleKey: `${S}.positionExposure.title`, icon: Compass }).fields([
      // Relocated from specifications.schema.ts. PDF-exact values/labels
      // (lowercase short codes, exact order). No dynamic logic.
      // Composition pass: .full() (was .third(), preserved verbatim through
      // the original content migration) — this is the only field in the
      // section at that width, with nothing to share a row with, so it was
      // stranded with dead space either side. Presentation-only; no
      // value/option/behavior change.
      field.select('cOrientation', `${S}.positionExposure.fields.cOrientation.label`)
        .full()
        .options(ORIENTATION_OPTIONS)
        .clearable()
        .build(),
      // Relocated from specifications.schema.ts. Multi-Enum, zero or more
      // values, no dynamic logic. Values preserved exactly, including the
      // deliberate duplicate — 'airy' and 'Clear' are distinct values that
      // both display the same label (Greek "Διαμπερές", English "Airy") —
      // not merged or deduplicated. Field's canonical PDF/entityDefs name is
      // Greek ("Χωροθέτηση"); `label` below is the English fallback, and
      // `labelKey` is what actually renders per active locale — see
      // properties.json's wizard.steps.outdoorBuildingAmenities.sections.
      // positionExposure.fields.cPlacement.options.* (el keeps this exact
      // Greek text, unchanged).
      field.multiSelect('cPlacement', `${S}.positionExposure.fields.cPlacement.label`)
        .full()
        .options(CPLACEMENT_OPTIONS)
        .build(),
    ]),

    section({ id: 'building', titleKey: `${S}.building.title`, icon: Building2 }).fields([
      // Distinct field from `cGarage` (construction-systems.schema.ts —
      // type/location of parking). This field is existence/size only
      // (Yes/No/Double). Cross-referenced by helper text, not merged.
      // Composition pass: .full() (was .half()) — every field after it in
      // this section (buildingElevator/buildingElevatorRooms/
      // internalElevator/hasDisabledAccess) is already .full(), so a lone
      // .half() garage left dead space before that run starts.
      field.select('garage', `${S}.building.fields.garage.label`)
        .full()
        .options(GARAGE_OPTIONS)
        .clearable()
        .helperText(`${S}.building.fields.garage.helperText`)
        .build(),
      // First of the elevator trio — kept strictly adjacent to
      // buildingElevatorRooms/internalElevator below.
      field.switch('buildingElevator', `${S}.building.fields.buildingElevator.label`)
        .full()
        .build(),
      field.switch('buildingElevatorRooms', `${S}.building.fields.buildingElevatorRooms.label`)
        .full()
        .build(),
      field.switch('internalElevator', `${S}.building.fields.internalElevator.label`)
        .full()
        .build(),
      // Distinct from the 'accessbility' option inside the `features`
      // Multi-Enum below — this is its own standalone Boolean attribute,
      // not a duplicate, not merged (unreconciled per spec, carried
      // forward as-is).
      field.switch('hasDisabledAccess', `${S}.building.fields.hasDisabledAccess.label`)
        .full()
        .build(),
    ]),

    section({ id: 'amenities', titleKey: `${S}.amenities.title`, icon: Sparkles }).fields([
      // Relocated from specifications.schema.ts. Multi-Enum — zero or more
      // values, no dynamic logic. Values/labels preserved exactly,
      // including deliberately inconsistent casing/spelling
      // ('accessbility', 'holiday Home', 'funnel', etc.) — do not
      // normalize, correct, or reorder. 'Building elevator' here is a
      // distinct string value from the standalone `buildingElevator`
      // Boolean field above — unrelated, not to be merged.
      field.multiSelect('features', `${S}.amenities.fields.features.label`)
        .full()
        .options([
          { value: 'Veranda',                     label: 'Veranda' },
          { value: 'petsAllowed',                 label: 'Pets Allowed' },
          { value: 'solarWaterHeating',           label: 'Solar Water Heating' },
          { value: 'Garden',                      label: 'Garden' },
          { value: 'nightPower',                  label: 'Night Power' },
          { value: 'luxHome',                     label: 'Lux Home' },
          { value: 'In a central point',          label: 'In a central point' },
          { value: 'Alarm',                       label: 'Alarm' },
          { value: 'Playroom',                    label: 'Playroom' },
          { value: 'Painted',                     label: 'Painted' },
          { value: 'For professional use',        label: 'For professional use' },
          { value: 'For employees',               label: 'For employees' },
          { value: 'familyHome',                  label: 'Family Home' },
          { value: 'For students',                label: 'For students' },
          { value: 'Sewer network',               label: 'Sewer network' },
          { value: 'preserved',                   label: 'Preserved' },
          { value: 'satelliteReceiver',           label: 'Satellite Receiver' },
          { value: 'holidayHome',                 label: 'holiday Home' },
          { value: 'InternalStairs',               label: 'Internal Stairs' },
          { value: 'unfinished',                  label: 'Unfinished' },
          { value: 'cableReady',                  label: 'Cable Ready' },
          { value: 'equipped',                    label: 'Equipped' },
          { value: 'neoclassic',                  label: 'Neoclassic' },
          { value: 'Residential area',            label: 'Residential area' },
          { value: 'awning',                      label: 'Awning' },
          { value: 'pestNet',                     label: 'Pest Net' },
          { value: 'furredCeiling',               label: 'Furred Ceiling' },
          { value: 'Tent',                        label: 'Tent' },
          { value: 'False ceiling',               label: 'False ceiling' },
          { value: 'attic',                       label: 'Attic' },
          { value: 'accessbility',                label: 'Access For People with Disabilities' },
          { value: 'funnel',                      label: 'funnel' },
          { value: 'for sanitary use',            label: 'for sanitary use' },
          { value: 'security rollers',            label: 'security rollers' },
          { value: 'freight elevator',            label: 'freight elevator' },
          { value: 'unloading ramp',               label: 'unloading ramp' },
          { value: 'structured cabling',          label: 'structured cabling' },
          { value: 'suitable for medical office', label: 'suitable for medical office' },
          { value: 'Building elevator',           label: 'Building elevator' },
        ])
        .build(),
      // Relocated from specifications.schema.ts. Multi-Enum, no dynamic
      // logic. Values/labels preserved exactly.
      field.multiSelect('additionalBenefits', `${S}.amenities.fields.additionalBenefits.label`)
        .full()
        .options([
          { value: 'BBQ',                  label: 'BBQ' },
          { value: 'Independent entrance', label: 'Independent entrance' },
        ])
        .build(),
      // Relocated from identity.schema.ts. No dynamic logic, never
      // required, no validation.
      field.switch('idealForStudents', `${S}.amenities.fields.idealForStudents.label`)
        .half()
        .build(),
      field.switch('idealForEmployees', `${S}.amenities.fields.idealForEmployees.label`)
        .half()
        .build(),
    ]),
  ],
}
