import type { PropertyAssignment } from '../types/property.types'

// Assignment (`cAssignment` — listing mandate: Simple/Exclusive) auto-
// population rule. Controlling field is Category — confirmed 2026-07-11:
// every category currently resolves to 'Simple'. Kept as an explicit
// per-category map (not a single flat default) so a future differentiated
// rule is a one-line change here, not a rewrite — same pattern as
// property-type.registry.ts's TYPE_VALUES_BY_CATEGORY.
const ASSIGNMENT_BY_CATEGORY: Record<'Residential' | 'Commercial' | 'Land' | 'Other', PropertyAssignment> = {
  Residential: 'Simple',
  Commercial: 'Simple',
  Land: 'Simple',
  Other: 'Simple',
}

/**
 * Resolves the auto-populated Assignment value for a given Category, or
 * `undefined` when the category is empty/unrecognized (rule doesn't apply —
 * the field-engine's auto-derive action leaves the field untouched in that
 * case, same "can't determine yet" behavior as getTypeOptionsForCategory
 * returning `[]`).
 */
export function getAssignmentForCategory(category: string | undefined | null): PropertyAssignment | undefined {
  if (!category) return undefined
  return ASSIGNMENT_BY_CATEGORY[category as keyof typeof ASSIGNMENT_BY_CATEGORY]
}
