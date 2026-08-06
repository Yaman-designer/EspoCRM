import { Wrench, Flame, DoorOpen } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema } from '@/framework/form-engine'
import { NOT_LAND_CATEGORY, NOT_LAND_OR_OTHER_CATEGORY, NOT_NEEDS_RENOVATION_AND_NOT_LAND, RENOVATED_TRUE, FURNISHED_HAS_VALUE } from '@/features/properties/domain/visibility'
import {
  ENERGY_CLASS_OPTIONS, HEATING_MEDIUM_OPTIONS, HEATING_CONTROLLER_OPTIONS, FRAMES_OPTIONS, DOOR_OPTIONS,
  FLOOR_TYPE_OPTIONS, BEDROOMS_FLOOR_TYPE_OPTIONS, PARKING_TYPE_OPTIONS, STORAGE_SPACE_OPTIONS,
  FURNISHED_OPTIONS, FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS,
} from '@/features/properties/domain/options'

// ── Step 5: Construction & Systems ──────────────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 4. 17 fields: 14 native
// to specifications.schema.ts's Construction & Systems section (migrated
// verbatim — same validation, visibility, requiredWhen, options) plus 3
// arriving from features.schema.ts's Interior & Comfort section (doubleGlass,
// cStorageSpace, hasElectricalDevices). The remaining 4 fields of
// specifications.schema.ts's Construction & Systems section (cOrientation,
// cPlacement, features, additionalBenefits) are Phase 5 scope, not migrated
// here — see the "specifications-legacy" holding step.
//
// The heating trio (cHeatingMedium/cHeatingController/cAdditionalheating) is
// kept strictly adjacent per spec — this resolves the naming-clash risk by
// proximity only; none of the three is renamed or merged.

const S = 'wizard.steps.constructionSystems.sections'

export const constructionSystemsSchema: StepSchema = {
  sections: [
    section({ id: 'condition', titleKey: `${S}.condition.title`, icon: Wrench }).fields([
      // Backend name preserved exactly as specified ("cUnderConstriction",
      // not "cUnderConstriction" — the misspelling is intentional, not
      // "fixed" during migration).
      field.switch('cUnderConstriction', `${S}.condition.fields.cUnderConstriction.label`)
        .half()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Root of the 3-field renovation chain — must precede Renovated.
      field.switch('itNeedsRenovation', `${S}.condition.fields.itNeedsRenovation.label`)
        .half()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Inverted-logic visibility: shown only when Needs Renovation = false
      // AND Category ≠ Land — see NOT_NEEDS_RENOVATION_AND_NOT_LAND. Kept
      // directly beneath its trigger; this is the field most likely to have
      // its condition accidentally flipped by a careless copy-paste move.
      // Composition pass: .full() (was .half()) — renovated=false is the
      // common initial state, where this field would otherwise be the sole
      // visible member of a 3-field .half() run (2 base switches above +
      // this one), stranded alone with dead space beside it. Its own reveal
      // below is full() for the same reason, so the pair always stacks
      // cleanly however many of the two are visible at once.
      field.switch('renovated', `${S}.condition.fields.renovated.label`)
        .full()
        .visibleWhen(NOT_NEEDS_RENOVATION_AND_NOT_LAND).clearWhenHidden()
        .build(),
      // Terminal chain node — visible only when Renovated = true. Max 2100,
      // no minimum defined (not invented).
      field.number('yearOfRenovation', `${S}.condition.fields.yearOfRenovation.label`)
        .full().max(2100)
        .visibleWhen(RENOVATED_TRUE).clearWhenHidden()
        .build(),
      // Field TYPE changed from Boolean/switch to Enum/select 2026-07-12
      // (CR-08, resolved): live entityDefs confirms furnished is a
      // 6-option Enum, not a Boolean — sending a raw boolean was verified
      // this session to return a hard 400 from EspoCRM, failing the entire
      // save whenever this field was touched. See FURNISHED_OPTIONS'
      // comment in domain/options.ts for the option list itself.
      //
      // Enterprise Phase 3.3, Finding E (resolved). No Dynamic Logic rule
      // covers furnished (neither the export nor the PDF mentions it), but
      // a controlled live A/B test this session proved the server silently
      // discards any furnished write when category = 'Land': identical
      // PATCH body, same record, failed under category=Land (HTTP 200,
      // value stayed null) and succeeded immediately after switching the
      // same record to category=Residential. Confirmed to be server-side
      // (bypasses this app's JS entirely) and not field-level-ACL (no entry
      // for furnished in acl.fieldTable/fieldTableQuickAccess) — most likely
      // a beforeSave hook or Formula script in EspoCRM's installed
      // "RealEstate" module enforcing "furniture status is meaningless for
      // land parcels." visibleWhen added so the Wizard stops offering a
      // control whose value the server silently throws away.
      // Composition pass: .full() (was .third()) — this is the only
      // .third()-width field in the section, with no peer of matching width
      // to share a row with, so it was stranded with dead space on either
      // side. Presentation-only.
      field.select('furnished', `${S}.condition.fields.furnished.label`)
        .full()
        .placeholder(`${S}.condition.fields.furnished.placeholder`)
        .options(FURNISHED_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // New 2026-07-12. Live entityDefs: multiEnum, 11 real options (see
      // FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS). Visible per
      // FURNISHED_HAS_VALUE — furnished has a value AND that value != 'no'
      // — see that ConditionNode's own comment for the case-mismatch
      // conflict this resolves against the Dynamic Logic export.
      field.multiSelect('cFurnitureElectricalAppliances', `${S}.condition.fields.cFurnitureElectricalAppliances.label`)
        .full()
        .options(FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS)
        .visibleWhen(FURNISHED_HAS_VALUE)
        .clearWhenHidden()
        .build(),
    ]),

    section({ id: 'energy-heating', titleKey: `${S}.energyHeating.title`, icon: Flame }).fields([
      // Business rule: Visibility AND Required both Category ≠ Land.
      // Composition pass: .half() (was .third()) — pairs it with
      // cHeatingMedium (also .half()) as a clean, perfectly-filled row at
      // every container tier, instead of the previous mismatch where
      // .third() only partially summed against its neighbor's width once
      // the container passed the 3-up breakpoint.
      field.select('energyClass', `${S}.energyHeating.fields.energyClass.label`)
        .half()
        .options(ENERGY_CLASS_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .requiredWhen(NOT_LAND_CATEGORY, 'Energy Class is required')
        .build(),
      // First of the heating trio — kept strictly adjacent to
      // cHeatingController/cAdditionalheating below, resolving the naming-
      // clash risk by proximity only (none renamed).
      field.select('cHeatingMedium', `${S}.energyHeating.fields.cHeatingMedium.label`)
        .half()
        .options(HEATING_MEDIUM_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Distinct field from cHeatingMedium (heating system control type, not
      // energy medium). Required Category ≠ Land AND Category ≠ Other.
      // Values/labels preserved exactly — do not "correct" spelling of
      // 'automic'/'autonomus', do not translate the Greek label. The en/el
      // translation entries for this key are intentionally identical
      // (verbatim "Τύπος θέρμανσης (Heating Type)") to honor that rule
      // while still routing the string through i18n like every other field.
      field.select('cHeatingController', `${S}.energyHeating.fields.cHeatingController.label`)
        .full()
        .options(HEATING_CONTROLLER_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .requiredWhen(NOT_LAND_OR_OTHER_CATEGORY, 'Heating type is required')
        .build(),
      // Multi-Enum, zero or more values. Visibility Category ≠ Land only (no
      // required rule). Closes the heating trio.
      field.multiSelect('cAdditionalheating', `${S}.energyHeating.fields.cAdditionalheating.label`)
        .full()
        .options([
          { value: 'air conditioning', label: 'Air Conditioning' },
          { value: 'underfloor',       label: 'Under floor' },
          { value: 'fireplace',        label: 'Fire place' },
        ])
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
    ]),

    section({ id: 'windows-doors-finishes', titleKey: `${S}.windowsDoorsFinishes.title`, icon: DoorOpen }).fields([
      // PDF label "Frames" (not "Window Frames"). Values/labels preserved
      // exactly. Visibility Category ≠ Land.
      // Composition pass: .full() (was .half()) — the next field (door) is
      // itself .full(), so a lone .half() frames left dead space beside it
      // before the row break. Matches door's own width, reads as a clean
      // consecutive pair of full-width selects (same pattern already used
      // by cHeatingController/cAdditionalheating above).
      field.select('frames', `${S}.windowsDoorsFinishes.fields.frames.label`)
        .full()
        .options(FRAMES_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // PDF label "Door" (not "Entry Door"). Visibility Category ≠ Land.
      field.select('door', `${S}.windowsDoorsFinishes.fields.door.label`)
        .full()
        .options(DOOR_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Relocated from features.schema.ts — no category gate, unlike its new
      // neighbors here. Preserved exactly; do not accidentally add one
      // during migration.
      field.switch('doubleGlass', `${S}.windowsDoorsFinishes.fields.doubleGlass.label`)
        .half()
        .build(),
      // PDF business rule: Visibility Category ≠ Land only. Values/labels
      // preserved exactly — spaces are not replaced with underscores/
      // hyphens, no capitalization changes.
      field.select('floorType', `${S}.windowsDoorsFinishes.fields.floorType.label`)
        .half()
        .options(FLOOR_TYPE_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Distinct field from floorType above (bedroom-specific flooring,
      // different value vocabulary). Visibility Category ≠ Land only.
      field.select('bedroomsFloorType', `${S}.windowsDoorsFinishes.fields.bedroomsFloorType.label`)
        .half()
        .options(BEDROOMS_FLOOR_TYPE_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Relocated from features.schema.ts. PDF label "Warehouse" (not
      // "Storage Space"). Visibility Category ≠ Land.
      field.select('cStorageSpace', `${S}.windowsDoorsFinishes.fields.cStorageSpace.label`)
        .half()
        .options(STORAGE_SPACE_OPTIONS)
        .clearable()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Distinct field from `garage` (existence/size: Yes/No/Double), which
      // lives in the Outdoor, Building & Amenities step landing in Phase 5 —
      // cross-referenced by name here (not by step number, which is still
      // moving during this migration), not merged. Visibility Category ≠
      // Land only.
      field.select('cGarage', `${S}.windowsDoorsFinishes.fields.cGarage.label`)
        .half()
        .options(PARKING_TYPE_OPTIONS)
        .clearable()
        .helperText(`${S}.windowsDoorsFinishes.fields.cGarage.helperText`)
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Relocated from features.schema.ts. Label humanized 2026-07-12 (CR-10)
      // — the PDF gives no human label for this field either, so no PDF
      // wording is being overridden; any reasonable label is safe here.
      field.switch('hasElectricalDevices', `${S}.windowsDoorsFinishes.fields.hasElectricalDevices.label`)
        .half()
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
    ]),
  ],
}
