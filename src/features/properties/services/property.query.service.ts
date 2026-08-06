import type { SortOption } from '../types/property.types'
import { fetchPropertyCount } from '../repositories/property.repository'

export const SORT_MAP: Record<SortOption, { orderBy: string; order: 'asc' | 'desc' }> = {
  newest:       { orderBy: 'createdAt', order: 'desc' },
  oldest:       { orderBy: 'createdAt', order: 'asc'  },
  'price-high': { orderBy: 'price',     order: 'desc' },
  'price-low':  { orderBy: 'price',     order: 'asc'  },
}

export function buildWhereParams(
  search:      string,
  type:        string,
  favoriteIds: string[] | null,
  bedrooms:    number | null,
  bathrooms:   number | null,
  minPrice:    number | null,
  maxPrice:    number | null,
): Record<string, string> {
  const params: Record<string, string> = {}
  let i = 0

  if (search.trim()) {
    params[`where[${i}][type]`]  = 'textFilter'
    params[`where[${i}][value]`] = search.trim()
    i++
  }
  if (type !== 'all') {
    params[`where[${i}][type]`]      = 'equals'
    params[`where[${i}][attribute]`] = 'type'
    params[`where[${i}][value]`]     = type
    i++
  }
  if (favoriteIds !== null && favoriteIds.length > 0) {
    params[`where[${i}][type]`]      = 'in'
    params[`where[${i}][attribute]`] = 'id'
    favoriteIds.forEach((id, j) => {
      params[`where[${i}][value][${j}]`] = id
    })
    i++
  }
  if (bedrooms !== null) {
    params[`where[${i}][type]`]      = 'greaterThanOrEquals'
    params[`where[${i}][attribute]`] = 'bedroomCount'
    params[`where[${i}][value]`]     = String(bedrooms)
    i++
  }
  if (bathrooms !== null) {
    params[`where[${i}][type]`]      = 'greaterThanOrEquals'
    params[`where[${i}][attribute]`] = 'bathroomCount'
    params[`where[${i}][value]`]     = String(bathrooms)
    i++
  }
  if (minPrice !== null) {
    params[`where[${i}][type]`]      = 'greaterThanOrEquals'
    params[`where[${i}][attribute]`] = 'price'
    params[`where[${i}][value]`]     = String(minPrice)
    i++
  }
  if (maxPrice !== null) {
    params[`where[${i}][type]`]      = 'lessThan'
    params[`where[${i}][attribute]`] = 'price'
    params[`where[${i}][value]`]     = String(maxPrice)
    i++
  }
  return params
}

// Wave 2 (2026-07-14): this previously queried status='Available' and
// status='Pending' — both fabricated values that don't exist in live
// EspoCRM, confirmed via a live per-status count query to always return 0
// regardless of real listing volume. Field names below match the real
// status vocabulary (see the approved Product Decision Record) instead of
// the old fabricated one.
export interface KPIStats {
  active:        number
  underApproval: number
  sold:          number
}

export async function fetchPropertyKPIs(): Promise<KPIStats> {
  const [active, underApproval, sold] = await Promise.all([
    fetchPropertyCount('status', 'Active'),
    fetchPropertyCount('status', 'Under Approval'),
    fetchPropertyCount('status', 'Sold'),
  ])
  return { active, underApproval, sold }
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface TypeOption {
  value: string
  label: string
  count: number | null
}

export interface PropertyOptions {
  types:     TypeOption[]
  bedrooms:  number[]
  bathrooms: number[]
}

const DEFAULT_TYPE_FALLBACK = ['Apartment', 'Detached', 'Maisonette', 'Plot', 'Studio', 'Store']
const BEDROOM_COUNTS        = [1, 2, 3, 4, 5]
const BATHROOM_COUNTS       = [1, 2, 3, 4, 5]

// Single metadata request — replaces the previous 25-request waterfall
// (1 metadata + 7 status counts + 7 type counts + 5 bedroom counts + 5 bathroom counts).
// Type options come from EspoCRM field metadata; bedroom/bathroom are static 1–5.
// Statuses are no longer fetched — the status filter was removed from the toolbar.
export async function fetchPropertyOptions(): Promise<PropertyOptions> {
  let typeValues: string[] = []

  try {
    const metaRes = await fetch('/api/espo-metadata')
    if (metaRes.ok) {
      const meta: { typeOptions?: string[] } = await metaRes.json()
      typeValues = meta?.typeOptions ?? []
    }
  } catch { /* fall through to defaults */ }

  // EspoCRM's enum field metadata includes '' as the unset/placeholder
  // option (its own admin UI's "-- select --" marker) alongside the real
  // values — not a selectable business value, so it's dropped before it
  // reaches the filter as a blank, non-functional chip.
  typeValues = typeValues.filter(v => v.trim() !== '')
  if (typeValues.length === 0) typeValues = [...DEFAULT_TYPE_FALLBACK]

  const types: TypeOption[] = typeValues.map(value => ({ value, label: value, count: null }))

  return {
    types,
    bedrooms:  BEDROOM_COUNTS,
    bathrooms: BATHROOM_COUNTS,
  }
}
