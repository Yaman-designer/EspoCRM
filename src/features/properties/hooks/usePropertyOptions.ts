'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPropertyOptions } from '../services/property.query.service'
import type { PropertyOptions } from '../services/property.query.service'

export type { StatusOption, TypeOption, PropertyOptions } from '../services/property.query.service'

export function usePropertyOptions() {
  return useQuery<PropertyOptions>({
    queryKey: ['property-options'],
    queryFn:  fetchPropertyOptions,
    staleTime:  5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })
}
