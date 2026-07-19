import { Ruler, Layers } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema } from '@/framework/form-engine'
import { NOT_LAND_CATEGORY, RESIDENTIAL_CATEGORY } from '@/features/properties/domain/visibility'
import { FLOOR_KEY_OPTIONS, CONDITION_OPTIONS } from '@/features/properties/domain/options'

// ── Step 4: Size, Rooms & Structure ─────────────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 4. 12 fields: the
// quantitative half of specifications.schema.ts's Size & Area + Rooms
// sections (11 fields, migrated verbatim — same validation, visibility,
// requiredWhen, options), plus `penthouse` arriving from identity.schema.ts.
// The remaining 18 fields of specifications.schema.ts's Construction &
// Systems section are NOT migrated here — 14 go to construction-systems.
// schema.ts (this same phase) and 4 (cOrientation, cPlacement, features,
// additionalBenefits) remain unmigrated until Phase 5, rendered by the
// "specifications-legacy" holding step.
//
// bedroomCount/bathroomCount/floor previously read a second, type-based
// land-detection rule (`NOT_LAND`) distinct from the category-based
// `NOT_LAND_CATEGORY` every other conditional field in this entity uses.
// Removed 2026-07-12: the Dynamic Logic export defines no visibility rule
// for any of these three fields, the PDF documents them with no flags
// either (confirmed independently against two separate readings of the
// same source PDF), and a sibling field in this exact section
// (`yearBuilt`, in the dead framework/metadata registry) already carries a
// note that the identical type-based rule was found to contradict the PDF
// and was removed for that field — this fix propagates that same,
// previously-incomplete correction to its three siblings. See the
// Conflict Register (CR-06) for full evidence.

export const sizeRoomsStructureSchema: StepSchema = {
  sections: [
    section({ id: 'size-rooms', title: 'Size & Rooms', icon: Ruler }).fields([
      // Enterprise Phase 3.2, Finding C (resolved: keep, document). Live
      // entityDefs declares min: 0, not 1 — 0 m² would pass server-side
      // validation. min(1) kept intentionally: a listing with zero total
      // area is not a representable real-world property, and `required()`
      // above already forces a value to be entered, so the practical choice
      // is between "a real area" and "a nonsensical one," not between
      // "some area" and "none."
      field.number('square', 'Total Area')
        .required().half().suffix('m²').min(1)
        .build(),
      // Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances). Live
      // entityDefs: type float, no min/max declared — none invented. Sits
      // beside Total Area, the field it's most directly comparable to.
      field.number('plotArea', 'Plot Area')
        .half().suffix('m²')
        .build(),
      field.number('balconyArea', 'Balcony Area')
        .half().suffix('m²')
        .build(),
      // Enterprise Certification Program (2026-07-16). Live entityDefs:
      // float, no min/max/required, no Dynamic Logic. Not restricted to
      // Category = Land — live data shows it populated on Residential and
      // Commercial records too — so it sits here with the other always-
      // visible measurements rather than in the Land Details cluster
      // (location-zoning.schema.ts). Distinct field from cFrontLength (a
      // separate custom int field, Land-only) — confirmed independent live.
      field.number('facadeLength', 'Facade Length')
        .half()
        .build(),
      // No visibleWhen/clearWhenHidden — no dynamic logic defined for this
      // field in the Dynamic Logic export or the PDF; always visible. See
      // CR-06.
      field.number('bedroomCount', 'Bedrooms')
        .quarter().min(0)
        .build(),
      field.number('bathroomCount', 'Bathrooms')
        .quarter().min(0)
        .build(),
      // Business rule: NOT (Category = Land) — see NOT_LAND_CATEGORY above.
      // Uses the category-based rule, unlike its Bedrooms/Bathrooms
      // neighbors above, which use the type-based one — flagged so no
      // implementer assumes both rows share one condition.
      field.number('cHalfBathrooms', 'WC')
        .quarter().min(0)
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // No visibleWhen/clearWhenHidden — no dynamic logic defined for this
      // field, always visible.
      field.number('livingRooms', 'Living Rooms')
        .quarter().min(0)
        .build(),
      // EC-4 (2026-07-15, Enterprise Certification Program). Live
      // entityDefs: int, min 0, no dynamic logic. Distinct real field from
      // livingRooms above, not a duplicate — 0/21,096 real records have it
      // set, but no technical disqualifier exists (not required, not
      // readOnly, not field-ACL-restricted — confirmed via a real
      // PATCH/GET/revert cycle this session). Certified via the Ownership
      // Resolution Report's evidence, assigned to this Epic.
      field.number('additionalLivingRooms', 'Additional Living Rooms')
        .quarter().min(0)
        .build(),
      // Business rule: NOT (Category = Land) — per the EspoCRM Dynamic Logic
      // export (logicDefs.fields.kitchens.visible). Same pattern as its
      // sibling cHalfBathrooms above.
      field.number('kitchens', 'Kitchens')
        .quarter().min(0)
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .build(),
      // Wave 5 (2026-07-15). Live Dynamic Logic: visible only when
      // category == 'Residential' — the first *positive* category check in
      // this entity (every prior condition is a negative NOT_LAND_CATEGORY
      // check). Distinct real fields from livingRooms/kitchens above, not a
      // rename — both pairs coexist live with independent data.
      field.number('cMasterrooms', 'Master Rooms')
        .quarter().min(0)
        .visibleWhen(RESIDENTIAL_CATEGORY).clearWhenHidden()
        .build(),
      field.number('cLivingkitchens', 'Living Kitchens')
        .quarter().min(0)
        .visibleWhen(RESIDENTIAL_CATEGORY).clearWhenHidden()
        .build(),
    ]),

    section({ id: 'building-position', title: 'Building Position', icon: Layers }).fields([
      // PDF-confirmed backend name `parkingSpaces`. .min(0) is a pre-existing
      // application rule, not a PDF requirement, preserved as-is.
      field.number('parkingSpaces', 'Parking Spaces')
        .half().min(0)
        .build(),
      // garageNumber intentionally NOT added here — live PATCH/GET round-trip
      // this session proved it silently fails to persist (HTTP 200,
      // modifiedAt updates, value stays null) — the same field-level-ACL
      // pattern as EC-1. See property.types.ts's comment.
      // No visibleWhen/clearWhenHidden — see CR-06.
      field.number('floor', 'Floor Number')
        .quarter().min(0)
        .build(),
      // Wave 5 (2026-07-15). Live entityDefs: type int, min 0, default 1, no
      // dynamic logic — always visible. Distinct from `floor` (which floor
      // number this unit is on) — this is the building's total floor count.
      field.number('floorCount', 'Floor Count')
        .quarter().min(0).default(1)
        .build(),
      // Business rule: Category ≠ Land for both visibility AND required-ness
      // — directly adjacent to Floor Number, resolving the Audit's finding
      // that the two were previously separated by unrelated rows.
      field.select('floorKey', 'Floor Key')
        .quarter()
        .placeholder('Select floor…')
        .options(FLOOR_KEY_OPTIONS)
        .visibleWhen(NOT_LAND_CATEGORY).clearWhenHidden()
        .requiredWhen(NOT_LAND_CATEGORY, 'Floor Key is required')
        .build(),
      field.switch('lastFloor', 'Last Floor')
        .quarter()
        .build(),
      // Visibility None (always visible) — required only when Category ≠
      // Land, via requiredWhen + NOT_LAND_CATEGORY.
      field.number('yearBuilt', 'Year Built')
        .quarter().min(0).max(2050)
        .requiredWhen(NOT_LAND_CATEGORY, 'Year Built is required')
        .build(),
      // Relocated from identity.schema.ts — no dynamic logic, never
      // required, no validation. Last in the step: a special-case flag that
      // only makes sense once Floor/Last Floor are already established.
      field.switch('penthouse', 'Penthouse')
        .half()
        .build(),
      // Wave 5 (2026-07-15). Real type is `rate` (a 5-star widget) — the
      // form-engine has no native star-rating field type (Wave 5
      // Pre-Implementation Verification), represented here as a plain 1-5
      // select over the same integer scale; see CONDITION_OPTIONS. Last in
      // the step: a summary quality judgment, most naturally read after
      // every other structural fact is already established.
      field.select('cCondition', 'Condition')
        .half()
        .placeholder('Rate condition…')
        .options(CONDITION_OPTIONS)
        .build(),
    ]),
  ],
}
