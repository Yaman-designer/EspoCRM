// Reusable boolean predicates over RealEstateProperty field values - consumed
// by both the legacy Edit dialog (features/properties/fields.ts, schema.ts)
// and the Create wizard (app/(dashboard)/properties/new/steps/*.schema.ts).
//
// Note: isLandType (type-based land detection) already lives in
// property-type.registry.ts and is available via the domain barrel
// (index.ts) alongside these - it was not moved or re-exported here, since
// the file it lives in is already the correct, working single source for
// everything type-related, and re-exporting it here would collide with that
// export in the barrel's `export *`.

/**
 * Category-based land detection - distinct from isLandType's type-based
 * detection. Backs the "Category != Land" rule that previously existed as an
 * inline `values.category !== 'Land'` check in features/properties/fields.ts
 * (two call sites) and as a separately-declared ConditionNode in both
 * specifications.schema.ts and features.schema.ts.
 */
export function isLandCategory(category: unknown): boolean {
  return category === 'Land'
}

/**
 * Floor Key is required unless Category = Land. Backs the rule that
 * previously existed twice with zero shared code: once as an imperative Zod
 * superRefine check in features/properties/schema.ts, and once as a
 * declarative form-engine requiredWhen condition in
 * app/(dashboard)/properties/new/steps/specifications.schema.ts.
 */
export function requiresFloorKey(category: unknown): boolean {
  return !isLandCategory(category)
}

/**
 * Is this property furnished at all (in any of the 6 real furnished/
 * halffurnished/fullyfurnished/half/full/no option values)? Mirrors
 * visibility.ts's FURNISHED_HAS_VALUE ConditionNode for plain (non-form-
 * engine) consumers — property-feature-mapper.ts, property-intelligence.ts,
 * property-narrative.ts — that need the same "furnished, in some capacity"
 * semantic outside the wizard. `furnished` was corrected from Boolean to
 * Enum 2026-07-12 (CR-08); these three files' prior `=== true` checks were
 * the direct fallout of that fix, not a pre-existing predicate to reuse.
 */
export function isFurnished(value: unknown): boolean {
  return typeof value === 'string' && value !== '' && value !== 'no'
}
