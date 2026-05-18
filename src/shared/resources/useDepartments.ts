'use client'

import { useQuery } from '@tanstack/react-query'
import { resourceRegistry, type ResourceOption } from '@/shared/registry'

export function useDepartments() {
  const def = resourceRegistry.departments
  return useQuery<ResourceOption[]>({
    queryKey: def.queryKey,
    queryFn: def.queryFn,
    staleTime: def.staleTime,
  })
}
