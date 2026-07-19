// Shared form-engine ConditionNodes for RealEstateProperty's Create wizard
// (app/(dashboard)/properties/new/steps/*.schema.ts). These are declarative
// data objects consumed directly by the form-engine's VisibilityEngine via
// field.visibleWhen()/.requiredWhen() and section({ visibility }) - they
// cannot be plain predicate functions, since the engine evaluates them
// without calling into application code (see framework/form-engine/
// VisibilityEngine.ts's evaluateCondition()).
//
// NOT_LAND_CATEGORY previously had two independent, identically-shaped
// declarations: one in specifications.schema.ts, one in features.schema.ts.
// The other nodes below were each declared once but are centralized here so
// every cross-field/cross-step condition for this entity lives in one place.

import type { ConditionNode } from '@/framework/form-engine'

// NOT_LAND (a `type`-based land detection, `type not_in LAND_TYPE_VALUES`)
// was removed 2026-07-12 (CR-06) — its only three consumers
// (bedroomCount/bathroomCount/floor in size-rooms-structure.schema.ts,
// furnished in construction-systems.schema.ts) all carried a visibility
// restriction with no basis in the PDF or the Dynamic Logic export. Do not
// reintroduce a type-based land check — every other conditional field in
// this entity correctly uses the category-based NOT_LAND_CATEGORY below;
// LAND_TYPE_VALUES itself still lives in property-type.registry.ts for its
// original purpose (type icon/label/category display), just no longer
// backs a visibility rule.

/**
 * category != 'Land' - the *category*-based land detection. Semantically
 * backed by predicates.ts's isLandCategory().
 */
export const NOT_LAND_CATEGORY: ConditionNode = { field: 'category', operator: 'neq', value: 'Land' }

/**
 * category == 'Land' — the positive counterpart of NOT_LAND_CATEGORY.
 * location-zoning.schema.ts's "Land Details" section previously declared
 * this same literal 15 times (1 section-level + 14 field-level) instead of
 * importing one shared constant — the only condition in this entity that
 * hadn't been centralized (Gap Register GAP-18).
 */
export const LAND_CATEGORY: ConditionNode = { field: 'category', operator: 'eq', value: 'Land' }

/**
 * category != 'Land' AND category != 'Other' — backs cHeatingController's
 * requiredWhen.
 *
 * Enterprise Phase 3.2, Finding 1 — RESOLVED WITH LIVE RUNTIME PROOF, not
 * just inference. Do not change this to match clientDefs.dynamicLogic; it
 * is clientDefs.dynamicLogic that is wrong, confirmed two independent ways:
 *
 * 1. EspoCRM's live Metadata response carries TWO separate definitions of
 *    this same rule: `clientDefs.RealEstateProperty.dynamicLogic.fields.
 *    cHeatingController.required` (an explicit OR of the two negations —
 *    tautological, since a single-valued field can't equal both 'Land' and
 *    'Other', so at least one side is always true) versus `logicDefs.
 *    RealEstateProperty.fields.cHeatingController.required` (a bare
 *    two-condition conditionGroup with no `type: 'or'` wrapper — implicitly
 *    AND, identical in shape to this constant).
 * 2. A live POST /RealEstateProperty against staging.realtorvoice.gr this
 *    session (2026-07-17), with cHeatingController omitted, proved which
 *    definition the server actually enforces: category='Other' failed
 *    validation on `yearBuilt` only (cHeatingController was never flagged),
 *    and category='Land' succeeded outright. Both outcomes match this
 *    AND-based rule exactly and contradict the OR reading (which predicts
 *    cHeatingController required in both cases). logicDefs, not
 *    clientDefs.dynamicLogic, is what EspoCRM's own server obeys.
 *
 * clientDefs.dynamicLogic's OR wrapper is therefore a confirmed upstream
 * EspoCRM authoring inconsistency between its own two internal
 * representations of one rule — not a defect in this implementation, which
 * already matches the server-enforced (logicDefs) version.
 */
export const NOT_LAND_OR_OTHER_CATEGORY: ConditionNode = {
  conditions: [
    { field: 'category', operator: 'neq', value: 'Land' },
    { field: 'category', operator: 'neq', value: 'Other' },
  ],
}

/** itNeedsRenovation = false AND category != 'Land'. */
export const NOT_NEEDS_RENOVATION_AND_NOT_LAND: ConditionNode = {
  conditions: [
    { field: 'itNeedsRenovation', operator: 'eq', value: false },
    { field: 'category', operator: 'neq', value: 'Land' },
  ],
}

/** renovated = true. */
export const RENOVATED_TRUE: ConditionNode = { field: 'renovated', operator: 'eq', value: true }

/** investment = true. */
export const INVESTMENT_TRUE: ConditionNode = { field: 'investment', operator: 'eq', value: true }

/** withinMonthlyUtilities = true. */
export const WITHIN_MONTHLY_UTILITIES_TRUE: ConditionNode = { field: 'withinMonthlyUtilities', operator: 'eq', value: true }

/** cBanner = true. */
export const CBANNER_TRUE: ConditionNode = { field: 'cBanner', operator: 'eq', value: true }

// EXCHANGE_SCHEME_TRUE (exchangeScheme = true) was removed 2026-07-17
// (Enterprise Phase 3.2, Finding 2) — exchangeSchemePercentage's own
// visibility was the only consumer. All 46 live Dynamic Logic rules were
// exhaustively checked in Phase 3.1 and exchangeSchemePercentage has no
// entry among them, unlike every other toggle-reveals-detail pair in this
// entity (investment/cRentalprice, withinMonthlyUtilities/
// cAverageMonthlyUtilities, cConsideration/cCompensationFactor). A field
// with no Dynamic Logic entry follows its layout placement unconditionally
// in live EspoCRM — this constant's gate did not match that behavior, so
// exchangeSchemePercentage is now always visible instead (see
// pricing-terms.schema.ts). Do not reintroduce a client-invented gate for
// this field without new live evidence that one actually exists.

/**
 * cConsideration = true — Wave 4 (2026-07-14, Pricing Reconciliation).
 * cConsideration itself lives in the Identity & Governance step; this
 * condition is consumed cross-step by cCompensationFactor in Pricing &
 * Terms, the same cross-step pattern already established by
 * NOT_LAND_CATEGORY (category also lives in Identity & Governance). Real
 * live Dynamic Logic rule confirmed at Gate 1→2 Resolution: cConsideration
 * had no target field until this wave.
 */
export const CCONSIDERATION_TRUE: ConditionNode = { field: 'cConsideration', operator: 'eq', value: true }

/**
 * category == 'Residential' — Wave 5 (2026-07-15, Rooms, Measurements, Views
 * & Distances). Live Dynamic Logic rule shared by cMasterrooms and
 * cLivingkitchens (first use of a positive category==X visibility rule in
 * this entity; every prior condition is a negative NOT_LAND_CATEGORY check).
 */
export const RESIDENTIAL_CATEGORY: ConditionNode = { field: 'category', operator: 'eq', value: 'Residential' }

/**
 * furnished has a value AND that value != 'no' — backs
 * cFurnitureElectricalAppliances' visibility.
 *
 * CONFLICT, resolved here: the Dynamic Logic export's rule compares
 * furnished against 'No' (capital N). Live EspoCRM entityDefs (queried
 * 2026-07-12) shows furnished's real enum options are all lowercase
 * ('no', 'furnished', 'halffurnished', 'fullyfurnished', 'half', 'full') —
 * there is no 'No' value. String comparison is case-sensitive, so the
 * export's rule as literally written would never match the real stored
 * value; this looks like the export capturing a since-renamed option.
 * Implemented here against the live, current, authoritative value ('no'),
 * not the export's stale casing.
 */
export const FURNISHED_HAS_VALUE: ConditionNode = {
  conditions: [
    { field: 'furnished', operator: 'not_empty' },
    { field: 'furnished', operator: 'neq', value: 'no' },
  ],
}
