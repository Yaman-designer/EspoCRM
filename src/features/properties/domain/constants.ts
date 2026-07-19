// ── Query key ─────────────────────────────────────────────────────────────────

export const PROPERTIES_QUERY_KEY = 'realEstateProperties'

// ── Pagination ────────────────────────────────────────────────────────────────

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

// ── Status display ────────────────────────────────────────────────────────────
// Enterprise Reconciliation Program, Wave 2 (2026-07-14): replaces the prior
// 7-value fabricated vocabulary (Available/Reserved/Pending/Under Approval/
// Rented/Sold/Draft) with the real live EspoCRM entityDefs enum, confirmed via
// authenticated Metadata API pull and re-verified unchanged immediately before
// this implementation. Old→new mapping is the officially approved Product
// Decision Record (Draft→Under Approval, Available→Active, Reserved→Under
// negotiation, Pending→Received payment) — see PDR, 2026-07-14.

export const PROPERTY_STATUSES = [
  'Under Approval', 'Active', 'Inactive', 'Not Approved',
  'Under negotiation', 'Received payment', 'Rented', 'Sold',
] as const

export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number]

// Colors grounded in EspoCRM's own live admin-side status `style` mapping
// (Under Approval/Not Approved=danger, Active=success, Inactive=neutral,
// Under negotiation/Received payment=violet, Rented/Sold=darkBlue), softened
// per the approved Status Design Specification (Gate 1→2 Resolution,
// 2026-07-14) — notably: Under Approval split from Not Approved (amber vs.
// rose, EspoCRM colors both "danger") and Sold kept its pre-existing crimson
// identity rather than grouped into Rented's blue (EspoCRM colors both
// "darkBlue") — both deviations explained in the Design Spec.
export const STATUS_DOT_COLORS: Record<string, string> = {
  'Under Approval':    'bg-amber-400',
  Active:               'bg-emerald-500',
  Inactive:             'bg-slate-400',
  'Not Approved':       'bg-rose-500',
  'Under negotiation':  'bg-violet-500',
  'Received payment':   'bg-purple-700',
  Rented:               'bg-blue-600',
  Sold:                 'bg-brand-crimson',
}

export const STATUS_DOT_FALLBACK = 'bg-muted-foreground/40'

// Lucide icon names (not components — keeps this module framework-agnostic;
// consumers map the string to an actual icon, e.g. PropertyStatusBadge.tsx).
// null means "no icon" — several statuses deliberately carry none, per the
// Design Spec's restraint principle (color alone is sufficient signal).
export const STATUS_ICONS: Record<string, string | null> = {
  'Under Approval':    'Clock',
  Active:               null,
  Inactive:             null,
  'Not Approved':       'XCircle',
  'Under negotiation':  'Handshake',
  'Received payment':   'CircleDollarSign',
  Rented:               'Key',
  Sold:                 null,
}

// 1 = highest attention priority, 8 = lowest. Used to sort/emphasize status
// in dashboards and lists. See Design Spec for the reasoning behind each rank.
export const STATUS_PRIORITY: Record<string, number> = {
  'Not Approved':       1,
  'Under Approval':     2,
  'Under negotiation':  3,
  'Received payment':   3,
  Active:               6,
  Rented:               6,
  Sold:                 7,
  Inactive:             8,
}

// ── Canonical Status registry ────────────────────────────────────────────────
// Derived from PROPERTY_STATUSES/STATUS_DOT_COLORS above — not a parallel list.
// Single source of truth for the new wizard's Identity-step status select.

export interface PropertyStatusDef {
  value: string
  label: string
  dotColor: string
  icon: string | null
  priority: number
  isDefault: boolean
}

export const PROPERTY_STATUS_REGISTRY: PropertyStatusDef[] = PROPERTY_STATUSES.map(value => ({
  value,
  label: value,
  dotColor: STATUS_DOT_COLORS[value] ?? STATUS_DOT_FALLBACK,
  icon: STATUS_ICONS[value] ?? null,
  priority: STATUS_PRIORITY[value] ?? 8,
  isDefault: value === 'Under Approval',
}))
