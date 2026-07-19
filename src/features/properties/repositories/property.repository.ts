import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type { RealEstateProperty } from '../types/property.types'

export interface PropertyListParams {
  maxSize: number
  offset:  number
  orderBy: string
  order:   'asc' | 'desc'
}

export async function fetchProperties(
  params: PropertyListParams,
  whereParams: Record<string, string> = {},
): Promise<EspoListResponse<RealEstateProperty>> {
  const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
    params: { ...params, ...whereParams },
  })
  return res.data
}

export async function deleteProperty(id: string): Promise<void> {
  await axiosClient.delete(`/RealEstateProperty/${id}`)
}

export async function createProperty(payload: Partial<RealEstateProperty>): Promise<RealEstateProperty> {
  const res = await axiosClient.post<RealEstateProperty>('/RealEstateProperty', payload)
  return res.data
}

export async function updateProperty(id: string, payload: Partial<RealEstateProperty>): Promise<RealEstateProperty> {
  const res = await axiosClient.patch<RealEstateProperty>(`/RealEstateProperty/${id}`, payload)
  return res.data
}

export async function fetchPropertyCount(attribute: string, value: string): Promise<number> {
  const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
    params: {
      maxSize: 1,
      'where[0][type]':      'equals',
      'where[0][attribute]': attribute,
      'where[0][value]':     value,
    },
  })
  return res.data.total
}

/**
 * Duplicate-detection primitive: is this reference code already used by
 * another property? propertyCode is the only confirmed EspoCRM attribute
 * suited to this (a short, human-assigned reference like "REF-001") — an
 * address/price fuzzy-match has no confirmed unique field to key on and is
 * not implemented.
 *
 * `excludeId` lets the Edit wizard check "does another record use this
 * code" rather than "does any record" — without it, editing a property
 * without changing its own code would always fail this check against itself.
 */
export async function isPropertyCodeTaken(code: string, excludeId?: string): Promise<boolean> {
  if (!excludeId) {
    const count = await fetchPropertyCount('propertyCode', code)
    return count > 0
  }

  const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
    params: {
      maxSize: 1,
      'where[0][type]':      'equals',
      'where[0][attribute]': 'propertyCode',
      'where[0][value]':     code,
      'where[1][type]':      'notEquals',
      'where[1][attribute]': 'id',
      'where[1][value]':     excludeId,
    },
  })
  return res.data.total > 0
}

