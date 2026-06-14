'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  PropertyFilters,
  SortOption,
  ViewMode,
  PriceRange,
  AreaRange,
} from '../types/property.types'
import { fetchProperties, deleteProperty } from '../repositories/property.repository'
import { SORT_MAP, buildWhereParams, fetchPropertyKPIs } from '../services/property.query.service'

// ── Constants ─────────────────────────────────────────────────────────────────

const QUERY_KEY = 'realEstateProperties'

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number]

const DEFAULT_FILTERS: PropertyFilters = {
  search:     '',
  status:     'all',
  type:       'all',
  sortBy:     'newest',
  priceRange: 'all',
  areaRange:  'all',
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProperties() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(12)

  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  const { data, isFetching, refetch } = useQuery<Awaited<ReturnType<typeof fetchProperties>>>({
    queryKey: [
      QUERY_KEY, page, pageSize,
      debouncedSearch, filters.status, filters.type, filters.sortBy,
      filters.priceRange, filters.areaRange,
    ],
    queryFn: () => {
      const { orderBy, order } = SORT_MAP[filters.sortBy]
      const whereParams = buildWhereParams(
        debouncedSearch, filters.status, filters.type,
        filters.priceRange, filters.areaRange,
      )
      return fetchProperties(
        { maxSize: pageSize, offset: (page - 1) * pageSize, orderBy, order },
        whereParams,
      )
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  // KPI counts — 4 parallel requests via service, reads total only
  const { data: kpiData } = useQuery({
    queryKey: [QUERY_KEY, 'kpi'],
    queryFn: fetchPropertyKPIs,
    staleTime: 60_000,
  })

  const properties = data?.list ?? []
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.type !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.areaRange !== 'all'
  const isLoading = data === undefined

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      toast.success('Property deleted')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: () => {
      toast.error('Failed to delete property')
    },
  })

  const onSearchChange     = useCallback((search: string)         => { setFilters(f => ({ ...f, search }));     setPage(1) }, [])
  const onStatusChange     = useCallback((status: string)         => { setFilters(f => ({ ...f, status }));     setPage(1) }, [])
  const onTypeChange       = useCallback((type: string)           => { setFilters(f => ({ ...f, type }));       setPage(1) }, [])
  const onSortChange       = useCallback((sortBy: SortOption)     => { setFilters(f => ({ ...f, sortBy }));     setPage(1) }, [])
  const onPriceRangeChange = useCallback((priceRange: PriceRange) => { setFilters(f => ({ ...f, priceRange })); setPage(1) }, [])
  const onAreaRangeChange  = useCallback((areaRange: AreaRange)   => { setFilters(f => ({ ...f, areaRange }));  setPage(1) }, [])
  const onClearFilters     = useCallback(()                       => { setFilters(DEFAULT_FILTERS);              setPage(1) }, [])
  const onViewModeChange   = useCallback((mode: ViewMode)         => setViewMode(mode), [])
  const onPageChange       = useCallback((p: number)              => setPage(p), [])
  const onPageSizeChange   = useCallback((size: PageSizeOption)   => { setPageSize(size); setPage(1) }, [])

  return {
    properties,
    isLoading,
    isFetching,
    page,
    pageSize,
    totalCount,
    totalPages,
    onPageChange,
    onPageSizeChange,
    filters,
    viewMode,
    hasFilters,
    onSearchChange,
    onStatusChange,
    onTypeChange,
    onSortChange,
    onPriceRangeChange,
    onAreaRangeChange,
    onClearFilters,
    onViewModeChange,
    refetch,
    deleteMutation,
    kpiStats: kpiData,
  }
}

export { PAGE_SIZE_OPTIONS }
