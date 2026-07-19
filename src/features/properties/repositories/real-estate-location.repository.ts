import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'

// RealEstateLocation — a self-referencing hierarchical entity (Region ->
// Sub Region -> Location via `parent`), distinct from RealEstateProperty's
// own `locationName`/`regionLocationName`/`subRegionLocationName` text
// attributes (which do not exist on the real backend entity - confirmed via
// live EspoCRM metadata). The three real relationship fields on
// RealEstateProperty are `regionLocation` (optional), `subRegionLocation`
// (required), and `location` (required) - all belongsTo RealEstateLocation.
//
// Top-level Regions (no parent, fixed query, no parameters) live in the
// shared resource registry instead of here - see
// shared/registry/index.ts's `regionLocations` entry / useRegionLocations()
// - the same place Users/Companies/Departments/Contacts/Roles live, since it
// fits that exact "static list" shape. Only the parameterized child fetch
// (parentId varies per selection) belongs in this entity-scoped repository.

export interface RealEstateLocationOption {
  id: string
  name: string
}

/**
 * Children of a given RealEstateLocation id - used for both Sub Region
 * (children of the selected Region) and Location (children of the selected
 * Sub Region). Same entity, same endpoint, same relationship, just a
 * different parentId - the ONLY difference from the top-level Region query
 * (shared/registry's `regionLocations`) is swapping its `isNull(parentId)`
 * whereGroup condition for `equals(parentId, <id>)`, same whereGroup[N]
 * structure and attributeSelect throughout.
 */
export async function fetchChildLocations(parentId: string): Promise<RealEstateLocationOption[]> {
  if (!parentId) return []
  const res = await axiosClient.get<EspoListResponse<RealEstateLocationOption>>('/RealEstateLocation', {
    params: {
      maxSize: 200,
      offset: 0,
      orderBy: 'name',
      order: 'asc',
      'whereGroup[0][type]': 'equals',
      'whereGroup[0][attribute]': 'parentId',
      'whereGroup[0][value]': parentId,
      attributeSelect: 'name',
    },
  })
  return res.data.list
}

/**
 * Single RealEstateLocation record by id — resolves the cascade's selected
 * ids back to a display name (e.g. for LocationMapPreview's geocode query,
 * which needs text, not ids).
 */
export async function fetchLocationById(id: string): Promise<RealEstateLocationOption | null> {
  if (!id) return null
  const res = await axiosClient.get<RealEstateLocationOption>(`/RealEstateLocation/${id}`, {
    params: { attributeSelect: 'name' },
  })
  return res.data
}
