import type { RealEstateProperty } from '../types/property.types'
import { getDataCompleteness } from '../lib/data-completeness'
import { PROPERTY_STATUSES, type PropertyStatusValue } from './constants'

// Property lifecycle / business-rule engine — the single source of truth for
// "which status transitions are legal" and "can this property go live."
//
// Enterprise Reconciliation Program, Wave 2 (2026-07-14): this file's prior
// header claimed EspoCRM's status field has "no separate isPublished/
// approvalStatus attribute" — contradicted by Stage A's live-confirmed
// discovery of real, separate `isListed`/`isAvailable` boolean fields
// (currently unexposed in the Wizard, out of Wave 2's scope). Correcting the
// claim here: `status` is the field this app models transitions against, but
// it is not the *only* real field describing a listing's public state, and
// must not be assumed synonymous with `isAvailable` if/when that field is
// ever exposed.
//
// PROPERTY_STATUS_TRANSITIONS below is a Wave 2 proposal (Gate 1→2
// Resolution, 2026-07-14) built from the real 8-value live entityDefs enum —
// not yet validated against real transition usage (nothing in the live data
// exercises most of these transitions, since the fabricated vocabulary this
// replaces was never used — see the Migration Plan). Treat as a reasoned
// starting point, not a fact derived from observed behavior.
//
// Consumed by both form systems in the app:
//   - the legacy Edit dialog (features/properties/schema.ts, via Zod .superRefine)
//   - the new wizard (properties/new/steps/identity-governance.schema.ts, via a
//     custom form-engine ValidationRule)
// Neither consumer re-implements this logic — both call the same functions.

export type { PropertyStatusValue }

/**
 * Allowed next-states per current status. Terminal states (Sold) have no
 * outgoing transitions — correcting a sold record is a data-fix, not a normal
 * workflow action.
 */
export const PROPERTY_STATUS_TRANSITIONS: Record<PropertyStatusValue, PropertyStatusValue[]> = {
  'Under Approval':    ['Active', 'Not Approved'],
  'Not Approved':      ['Under Approval'],
  Active:              ['Under negotiation', 'Inactive', 'Rented', 'Sold'],
  'Under negotiation': ['Active', 'Received payment', 'Rented', 'Sold'],
  'Received payment':  ['Active', 'Rented', 'Sold'],
  Rented:              ['Active', 'Inactive'],
  Sold:                [],
  Inactive:            ['Active', 'Under Approval'],
}

/**
 * Minimum data-completeness score (0-100) required to transition a property
 * INTO 'Active' — i.e. to publish it. Reuses data-completeness.ts's
 * existing 'complete' threshold rather than inventing a second number.
 */
export const MIN_COMPLETENESS_TO_PUBLISH = 65

export interface RuleResult {
  allowed: boolean
  reason?: string
}

/**
 * Is `from -> to` a legal status transition?
 * `from` undefined means "new record" (create) — always allowed, since there
 * is no prior state to violate.
 */
export function canTransition(from: string | undefined, to: string): RuleResult {
  if (!from || from === to) return { allowed: true }

  const allowedNext = PROPERTY_STATUS_TRANSITIONS[from as PropertyStatusValue]
  if (!allowedNext) {
    // Unrecognized prior status (e.g. a value EspoCRM added that this app
    // doesn't know about yet) — do not block; only enforce known transitions.
    return { allowed: true }
  }
  if (allowedNext.includes(to as PropertyStatusValue)) return { allowed: true }

  return {
    allowed: false,
    reason: `Cannot move from "${from}" to "${to}". Allowed next steps: ${
      allowedNext.length ? allowedNext.join(', ') : 'none — this status is final'
    }.`,
  }
}

/**
 * Can this property go live (transition INTO 'Active')? Requires the
 * existing data-completeness scorer to clear MIN_COMPLETENESS_TO_PUBLISH.
 * Applies on both create and edit — publish-readiness doesn't depend on history.
 */
export function canPublish(property: Partial<RealEstateProperty>): RuleResult {
  const completeness = getDataCompleteness(property as RealEstateProperty)
  if (completeness.score >= MIN_COMPLETENESS_TO_PUBLISH) return { allowed: true }

  return {
    allowed: false,
    reason: `Listing is only ${completeness.score}% complete (needs ${MIN_COMPLETENESS_TO_PUBLISH}%). Missing: ${
      completeness.missing.join(', ')
    }.`,
  }
}

/**
 * Combined check used by both form systems before allowing a status change:
 * validates the transition itself, then (only when moving into 'Active')
 * the completeness gate.
 */
export function validateStatusChange(
  from: string | undefined,
  to: string,
  property: Partial<RealEstateProperty>,
): RuleResult {
  const transition = canTransition(from, to)
  if (!transition.allowed) return transition

  if (to === 'Active') return canPublish(property)

  return { allowed: true }
}

/**
 * Ownership rule. Previously exempted 'Draft' (no owner required for an
 * unsubmitted listing) — retired in Wave 2 (2026-07-14): the real
 * `assignedUser` field is unconditionally `required:true` in live EspoCRM
 * entityDefs (confirmed at Stage A and re-verified unchanged immediately
 * before this change), with no per-status exemption. Every real status,
 * including the new default 'Under Approval', requires an agent. Kept as a
 * function (not inlined at call sites) so this rule has exactly one place to
 * change if EspoCRM's own constraint is ever relaxed.
 */
// `status` is kept for call-site compatibility (identity-governance.schema.ts
// calls this with a status argument); always true regardless of its value.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function requiresOwner(status: string): boolean {
  return true
}
