'use client'

import { useQuery } from '@tanstack/react-query'
import { resourceRegistry, type ResourceOption } from '@/shared/registry'

// ── Select options (label = name, value = id) — used by the Property Wizard's
// Region -> Sub Region -> Location cascade (top level only; Sub Region and
// Location are parentId-dependent and loaded via the dependency engine
// instead, see location-zoning.schema.ts) ──────────────────────────────────

export function useRegionLocations() {
  const def = resourceRegistry.regionLocations
  return useQuery<ResourceOption[]>({
    queryKey: def.queryKey,
    queryFn: def.queryFn,
    staleTime: def.staleTime,
  })
}
