'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchProperties } from '../repositories/property.repository'
import { computePortfolioRanks } from '../lib/portfolio-analytics'
import { PROPERTIES_QUERY_KEY } from '../domain/constants'
import type { RealEstateProperty } from '../types/property.types'

export function usePortfolioRanks(current: RealEstateProperty) {
  const { data: portfolio, isLoading } = useQuery({
    queryKey:  [PROPERTIES_QUERY_KEY, 'portfolio-ranks'],
    queryFn:   async () => {
      const result = await fetchProperties(
        { maxSize: 200, offset: 0, orderBy: 'createdAt', order: 'desc' },
        {},
      )
      return result.list
    },
    staleTime: 5 * 60_000,
  })

  const ranks = portfolio != null ? computePortfolioRanks(current, portfolio) : null

  return { ranks, isLoading: isLoading && ranks == null }
}
