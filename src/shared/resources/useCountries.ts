'use client'

import { useQuery } from '@tanstack/react-query'
import type { ResourceOption } from '@/shared/registry'

// Countries are not available as a REST entity in this EspoCRM instance.
// Returns an empty list until a proper endpoint is configured.
export function useCountries() {
  return useQuery<ResourceOption[]>({
    queryKey: ['resource', 'countries'],
    queryFn: () => Promise.resolve([]),
    staleTime: Infinity,
  })
}
