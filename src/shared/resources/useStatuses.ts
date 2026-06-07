'use client'

import { useQuery } from '@tanstack/react-query'
import type { ResourceOption } from '@/shared/registry'

// Statuses are enum-based in this EspoCRM instance and not a REST entity.
// Returns an empty list until a proper endpoint is configured.
export function useStatuses() {
  return useQuery<ResourceOption[]>({
    queryKey: ['resource', 'statuses'],
    queryFn: () => Promise.resolve([]),
    staleTime: Infinity,
  })
}
