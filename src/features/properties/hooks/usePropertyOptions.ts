'use client'

import { useQuery } from '@tanstack/react-query'
import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type { RealEstateProperty } from '../types/property.types'

export interface StatusOption {
  value: string
  label: string
  count: number
  dot:   string
}

export interface TypeOption {
  value: string
  label: string
  count: number
}

export interface PropertyOptions {
  statuses: StatusOption[]
  types:    TypeOption[]
}

// Semantic dot colors — matches PropertyStatusBadge DOT map exactly.
// Only the color is UI concern; the list of statuses comes from the API.
const STATUS_DOT: Record<string, string> = {
  'Available':       'bg-emerald-500',
  'Pending':         'bg-amber-400',
  'Under Approval':  'bg-orange-400',
  'Rented':          'bg-teal-500',
  'Sold':            'bg-rose-500',
  'Draft':           'bg-slate-400',
}

const FALLBACK_DOT = 'bg-muted-foreground/40'

async function fetchCount(attribute: string, value: string): Promise<number> {
  try {
    const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>(
      '/RealEstateProperty',
      { params: { maxSize: 1, 'where[0][type]': 'equals', 'where[0][attribute]': attribute, 'where[0][value]': value } },
    )
    return res.data.total
  } catch {
    return 0
  }
}

export function usePropertyOptions() {
  return useQuery<PropertyOptions>({
    queryKey: ['property-options'],
    queryFn: async () => {
      // Fetch field options from EspoCRM metadata
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

      // Fall back to known values when metadata unavailable
      if (statusValues.length === 0) {
        statusValues = ['Available', 'Pending', 'Under Approval', 'Rented', 'Sold', 'Draft']
      }
      if (typeValues.length === 0) {
        typeValues = ['Villa', 'Apartment', 'House', 'Townhouse', 'Office', 'Land', 'Warehouse']
      }

      // Fetch live counts in parallel — shows only options that actually have properties
      const [statusCounts, typeCounts] = await Promise.all([
        Promise.all(statusValues.map(async s => ({ value: s, count: await fetchCount('status', s) }))),
        Promise.all(typeValues.map(async t => ({ value: t, count: await fetchCount('type', t) }))),
      ])

      const statuses: StatusOption[] = statusCounts
        .filter(({ count }) => count > 0)
        .map(({ value, count }) => ({
          value,
          label: value,
          count,
          dot: STATUS_DOT[value] ?? FALLBACK_DOT,
        }))

      const types: TypeOption[] = typeCounts
        .filter(({ count }) => count > 0)
        .map(({ value, count }) => ({ value, label: value, count }))

      return { statuses, types }
    },
    staleTime:  5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })
}
