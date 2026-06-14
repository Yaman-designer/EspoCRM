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

export async function fetchPropertyCount(attribute: string, value: string): Promise<number> {
  try {
    const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
      params: {
        maxSize: 1,
        'where[0][type]':      'equals',
        'where[0][attribute]': attribute,
        'where[0][value]':     value,
      },
    })
    return res.data.total
  } catch {
    return 0
  }
}
