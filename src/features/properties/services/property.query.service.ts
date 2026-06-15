import type { SortOption, PriceRange, AreaRange } from '../types/property.types'
import { fetchPropertyCount } from '../repositories/property.repository'
import { PROPERTY_STATUSES, STATUS_DOT_COLORS, STATUS_DOT_FALLBACK } from '../domain/constants'

export const SORT_MAP: Record<SortOption, { orderBy: string; order: 'asc' | 'desc' }> = {
  newest:       { orderBy: 'createdAt', order: 'desc' },
  oldest:       { orderBy: 'createdAt', order: 'asc'  },
  'price-high': { orderBy: 'price',     order: 'desc' },
  'price-low':  { orderBy: 'price',     order: 'asc'  },
}

const PRICE_BOUNDS: Record<PriceRange, { min?: number; max?: number }> = {
  'all':       {},
  'under500k': {                  max: 500_000   },
  '500k-1m':   { min: 500_000,   max: 1_000_000 },
  '1m-2m':     { min: 1_000_000, max: 2_000_000 },
  'over2m':    { min: 2_000_000               },
}

const AREA_BOUNDS: Record<AreaRange, { min?: number; max?: number }> = {
  'all':      {},
  'under100': {            max: 100 },
  '100-500':  { min: 100, max: 500 },
  'over500':  { min: 500           },
}

export function buildWhereParams(
  search:     string,
  status:     string,
  type:       string,
  priceRange: PriceRange,
  areaRange:  AreaRange,
): Record<string, string> {
  const params: Record<string, string> = {}
  let i = 0

  if (search.trim()) {
    params[`where[${i}][type]`]  = 'textFilter'
    params[`where[${i}][value]`] = search.trim()
    i++
  }
  if (status !== 'all') {
    params[`where[${i}][type]`]      = 'equals'
    params[`where[${i}][attribute]`] = 'status'
    params[`where[${i}][value]`]     = status
    i++
  }
  if (type !== 'all') {
    params[`where[${i}][type]`]      = 'equals'
    params[`where[${i}][attribute]`] = 'type'
    params[`where[${i}][value]`]     = type
    i++
  }
  if (priceRange !== 'all') {
    const { min, max } = PRICE_BOUNDS[priceRange]
    if (min !== undefined) {
      params[`where[${i}][type]`]      = 'greaterThanOrEquals'
      params[`where[${i}][attribute]`] = 'price'
      params[`where[${i}][value]`]     = String(min)
      i++
    }
    if (max !== undefined) {
      params[`where[${i}][type]`]      = 'lessThan'
      params[`where[${i}][attribute]`] = 'price'
      params[`where[${i}][value]`]     = String(max)
      i++
    }
  }
  if (areaRange !== 'all') {
    const { min, max } = AREA_BOUNDS[areaRange]
    if (min !== undefined) {
      params[`where[${i}][type]`]      = 'greaterThanOrEquals'
      params[`where[${i}][attribute]`] = 'square'
      params[`where[${i}][value]`]     = String(min)
      i++
    }
    if (max !== undefined) {
      params[`where[${i}][type]`]      = 'lessThan'
      params[`where[${i}][attribute]`] = 'square'
      params[`where[${i}][value]`]     = String(max)
      i++
    }
  }
  return params
}

export interface KPIStats {
  available: number
  pending:   number
  sold:      number
}

export async function fetchPropertyKPIs(): Promise<KPIStats> {
  const [available, pending, underApproval, sold] = await Promise.all([
    fetchPropertyCount('status', 'Available'),
    fetchPropertyCount('status', 'Pending'),
    fetchPropertyCount('status', 'Under Approval'),
    fetchPropertyCount('status', 'Sold'),
  ])
  return { available, pending: pending + underApproval, sold }
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface StatusOption {
  value: string
  label: string
  // null means the count API failed — the option is still shown so users
  // can filter by it; the display layer renders a dash instead of a number.
  count: number | null
  dot:   string
}

export interface TypeOption {
  value: string
  label: string
  count: number | null
}

export interface PropertyOptions {
  statuses: StatusOption[]
  types:    TypeOption[]
}

const DEFAULT_TYPE_VALUES = ['Villa', 'Apartment', 'House', 'Townhouse', 'Office', 'Land', 'Warehouse']

export async function fetchPropertyOptions(): Promise<PropertyOptions> {
  let statusValues: string[] = []
  let typeValues:   string[] = []

  try {
    const metaRes = await fetch('/api/espo-metadata')
    if (metaRes.ok) {
      const meta: { statusOptions?: string[]; typeOptions?: string[] } = await metaRes.json()
      statusValues = meta?.statusOptions ?? []
      typeValues   = meta?.typeOptions   ?? []
    }
  } catch { /* fall through to defaults */ }

  if (statusValues.length === 0) statusValues = [...PROPERTY_STATUSES]
  if (typeValues.length === 0)   typeValues   = [...DEFAULT_TYPE_VALUES]

  // Use allSettled so a single slow/failing count request does not prevent the
  // other options from loading. Rejected counts become null; the UI shows a
  // dash rather than hiding the option (which would be incorrect if the entity
  // actually exists but the count API was temporarily unavailable).
  const settle = async (attribute: string, value: string): Promise<number | null> => {
    const result = await Promise.allSettled([fetchPropertyCount(attribute, value)])
    return result[0].status === 'fulfilled' ? result[0].value : null
  }

  const [statusCounts, typeCounts] = await Promise.all([
    Promise.all(statusValues.map(async s => ({ value: s, count: await settle('status', s) }))),
    Promise.all(typeValues.map(async t => ({ value: t, count: await settle('type', t) }))),
  ])

  const statuses: StatusOption[] = statusCounts
    // Keep options whose count is known-positive or unknown (null).
    // Filter only confirmed-zero counts — those are genuinely empty.
    .filter(({ count }) => count === null || count > 0)
    .map(({ value, count }) => ({
      value,
      label: value,
      count,
      dot: STATUS_DOT_COLORS[value] ?? STATUS_DOT_FALLBACK,
    }))

  const types: TypeOption[] = typeCounts
    .filter(({ count }) => count === null || count > 0)
    .map(({ value, count }) => ({ value, label: value, count }))

  return { statuses, types }
}
