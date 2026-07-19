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

export const outdoorBuildingAmenitiesSchema: StepSchema = {
  sections: [
    section({ id: 'outdoor-space', title: 'Outdoor Space', icon: TreePine }).fields([
      // Reconciled from a 4-value descriptive select to the PDF's true
      // Boolean type. Visibility Category ≠ Land.
      field.switch('balcony', 'Balcony')
        .half()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // PDF-exact order/values/labels. No category gate — a demand signal
      // that stays visible regardless of category.
      field.select('swimmingPool', 'Swimming Pool')
        .half()
        .options(SWIMMING_POOL_OPTIONS)
        .clearable()
        .build(),
      // PDF-exact order/values/labels, incl. deliberately spaced values
      // ('Dirt road', 'No access') — preserved exactly.
      field.select('accessFrom', 'Access From')
        .half()
        .options(ACCESS_FROM_OPTIONS)
        .clearable()
        .build(),
    ]),

    section({ id: 'position-exposure', title: 'Position & Exposure', icon: Compass }).fields([
      // Relocated from specifications.schema.ts. PDF-exact values/labels
      // (lowercase short codes, exact order). No dynamic logic. Span
      // preserved exactly as .third() from the original — not resized
      // during migration.
      field.select('cOrientation', 'Orientation')
        .third()
        .options(ORIENTATION_OPTIONS)
        .clearable()
        .build(),
      // Relocated from specifications.schema.ts. Multi-Enum, zero or more
      // values, no dynamic logic. Values/labels preserved exactly,
      // including the deliberate duplicate label (Διαμπερές) shared by the
      // distinct 'airy' and 'Clear' values — not merged or deduplicated.
      field.multiSelect('cPlacement', 'Χωροθέτηση')
        .full()
        .options([
          { value: 'airy',             label: 'Διαμπερές' },
          { value: 'painted',          label: 'Βαμμένο' },
          { value: 'corner',           label: 'Γωνιακό' },
          { value: 'Facade',           label: 'Πρόσοψης' },
          { value: 'Interior',         label: 'Εσωτερικό' },
          { value: 'forCommercialUse', label: 'Για επαγγελματική χρήση' },
          { value: 'Side',             label: 'Πλαϊνό' },
          { value: 'Clear',            label: 'Διαμπερές' },
          { value: 'bright',           label: 'Φωτεινό' },
          { value: 'Three-sided',      label: 'Τριών Όψεων' },
          { value: 'Four-sided',       label: 'Τεσσάρων Όψεων' },
        ])
        .build(),
    ]),

    section({ id: 'building', title: 'Building', icon: Building2 }).fields([
      // Distinct field from `cGarage` (construction-systems.schema.ts —
      // type/location of parking). This field is existence/size only
      // (Yes/No/Double). Cross-referenced by helper text, not merged.
      field.select('garage', 'Garage')
        .half()
        .options(GARAGE_OPTIONS)
        .clearable()
        .helperText('Existence/size of a parking spot. See also "Parking Type" in the Construction & Systems step.')
        .build(),
      // First of the elevator trio — kept strictly adjacent to
      // buildingElevatorRooms/internalElevator below.
      field.switch('buildingElevator', 'Building Elevator')
        .full()
        .build(),
      field.switch('buildingElevatorRooms', 'Elevator in Rooms')
        .full()
        .build(),
      field.switch('internalElevator', 'Internal Elevator')
        .full()
        .build(),
      // Distinct from the 'accessbility' option inside the `features`
      // Multi-Enum below — this is its own standalone Boolean attribute,
      // not a duplicate, not merged (unreconciled per spec, carried
      // forward as-is).
      field.switch('hasDisabledAccess', 'Disabled Access')
        .full()
        .build(),
    ]),

    section({ id: 'amenities', title: 'Amenities', icon: Sparkles }).fields([
      // Relocated from specifications.schema.ts. Multi-Enum — zero or more
      // values, no dynamic logic. Values/labels preserved exactly,
      // including deliberately inconsistent casing/spelling
      // ('accessbility', 'holiday Home', 'funnel', etc.) — do not
      // normalize, correct, or reorder. 'Building elevator' here is a
      // distinct string value from the standalone `buildingElevator`
      // Boolean field above — unrelated, not to be merged.
      field.multiSelect('features', 'Features')
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
      field.multiSelect('additionalBenefits', 'Additional Benefits')
        .full()
        .options([
          { value: 'BBQ',                  label: 'BBQ' },
          { value: 'Independent entrance', label: 'Independent entrance' },
        ])
        .build(),
      // Relocated from identity.schema.ts. No dynamic logic, never
      // required, no validation.
      field.switch('idealForStudents', 'Ideal for Students')
        .half()
        .build(),
      field.switch('idealForEmployees', 'Ideal for Employees')
        .half()
        .build(),
    ]),
  ],
}
