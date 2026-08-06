/**
 * Status → color/label mapping for the property detail page. Two
 * independent presentations exist on this page today with genuinely
 * different bucket boundaries (Hero treats Sold/Rented as a distinct
 * "negative" bucket; Command Hub doesn't). Per the refactor's rule —
 * consolidate code, never change rendered output — the two are kept as
 * separate named exports rather than merged into one "correct" mapping,
 * with the divergence documented here instead of silently unified.
 */

// ── Command Hub sidebar (dot / background tint / sub-label) ────────────────
// Wave 2 (2026-07-14): rebuilt for the real 8-value live status enum — see
// the approved Product Decision Record for the old→new mapping.

const KNOWN_COMMAND_HUB_STATUSES = new Set([
  'Active', 'Under negotiation', 'Received payment', 'Under Approval',
  'Not Approved', 'Sold', 'Rented', 'Inactive',
])

/**
 * Returns the translation-key suffix for this status's Command Hub
 * sub-label (properties.json's operations.commandHubStatusSub.<status>),
 * or '' when unmapped — pure, no i18n import (view-models/** can't import
 * React/i18n; OperationsCommandHub.tsx resolves the actual text via t()).
 */
export function getCommandHubStatusSubKey(status: string): string {
  return KNOWN_COMMAND_HUB_STATUSES.has(status) ? status : ''
}

export function getCommandHubStatusDotClass(status: string, isAvailable: boolean): string {
  if (isAvailable) return 'bg-emerald-500'
  if (status === 'Under Approval' || status === 'Not Approved') return 'bg-rose-500'
  if (status === 'Under negotiation' || status === 'Received payment') return 'bg-amber-500'
  return 'bg-muted-foreground/30'
}

// Command Hub Visual Refinement pass (2026-07-22). A soft tint of the same
// semantic color as the status dot, reused as the anchor card's background.
export function getCommandHubStatusBgClass(status: string, isAvailable: boolean): string {
  if (isAvailable) return 'bg-emerald-500/6'
  if (status === 'Under Approval' || status === 'Not Approved') return 'bg-rose-500/6'
  if (status === 'Under negotiation' || status === 'Received payment') return 'bg-amber-500/6'
  return 'bg-muted/6'
}

// ── Hero banner (solid status pill fill) ────────────────────────────────────
// Wave 2 (2026-07-14): rebuilt for the real 8-value live status enum. Reused
// here for the Status badge's solid fill instead of a text-color-only treatment.

export function getHeroStatusFillClass(status?: string): string {
  if (status === 'Active') return 'bg-brand-emerald border-brand-emerald'
  if (status === 'Sold' || status === 'Rented') return 'bg-brand-crimson border-brand-crimson'
  if (status === 'Under Approval' || status === 'Not Approved' ||
      status === 'Under negotiation' || status === 'Received payment') return 'bg-amber-600 border-amber-600'
  return 'bg-primary border-primary'
}
