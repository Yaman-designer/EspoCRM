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

export async function followProperty(id: string): Promise<void> {
  await axiosClient.post(`/RealEstateProperty/${id}/follow`)
}

export async function unfollowProperty(id: string): Promise<void> {
  await axiosClient.delete(`/RealEstateProperty/${id}/follow`)
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

// ── Alternative Saved architecture ───────────────────────────────────────────
//
// The isFollowed WHERE clause (used by the Saved filter) requires EspoCRM to
// JOIN entity_follow on every request, which is slow when the table is large.
//
// Alternative: preload all followed property IDs once, then use an `in` WHERE
// clause for subsequent paginated queries — a single fast PK lookup instead of
// a full join.
//
// Usage pattern:
//   const ids = await fetchFollowedPropertyIds()   // cache this with React Query
//   // Then pass ids to buildWhereParams via a new 'in' branch:
//   params[`where[N][type]`]       = 'in'
//   params[`where[N][attribute]`]  = 'id'
//   params[`where[N][value][]`]    = ids.join(',')  // EspoCRM array syntax
//
// Trade-off: stale when the user follows/unfollows a property elsewhere.
// Invalidate the IDs query key on followProperty / unfollowProperty mutations.

export async function fetchFollowedPropertyIds(): Promise<string[]> {
  const res = await axiosClient.get<EspoListResponse<{ id: string }>>('/RealEstateProperty', {
    params: {
      select: 'id',
      maxSize: 1000,
      'where[0][type]': 'isFollowed',
    },
  })
  return res.data.list.map(p => p.id)
}
