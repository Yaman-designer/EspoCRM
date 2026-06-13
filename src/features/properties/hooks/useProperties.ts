'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type {
  RealEstateProperty,
  PropertyFilters,
  SortOption,
  ViewMode,
  PriceRange,
  AreaRange,
} from '../types/property.types'

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

const SORT_MAP: Record<SortOption, { orderBy: string; order: 'asc' | 'desc' }> = {
  newest:       { orderBy: 'createdAt', order: 'desc' },
  oldest:       { orderBy: 'createdAt', order: 'asc'  },
  'price-high': { orderBy: 'price',     order: 'desc' },
  'price-low':  { orderBy: 'price',     order: 'asc'  },
}

const PRICE_BOUNDS: Record<PriceRange, { min?: number; max?: number }> = {
  'all':       {},
  'under500k': {                   max: 500_000   },
  '500k-1m':   { min: 500_000,   max: 1_000_000 },
  '1m-2m':     { min: 1_000_000, max: 2_000_000 },
  'over2m':    { min: 2_000_000               },
}

const AREA_BOUNDS: Record<AreaRange, { min?: number; max?: number }> = {
  'all':      {},
  'under100': {           max: 100 },
  '100-500':  { min: 100, max: 500 },
  'over500':  { min: 500           },
}

function buildWhereParams(
  search:     string,
  status:     string,
  type:       string,
  priceRange: PriceRange,
  areaRange:  AreaRange,
): Record<string, string> {
  const params: Record<string, string> = {}
  let i = 0

  if (search.trim()) {
    params[`where[${i}][type]`]  = 'textFilter'
    params[`where[${i}][value]`] = search.trim()
    i++
  }
  if (status !== 'all') {
    params[`where[${i}][type]`]      = 'equals'
    params[`where[${i}][attribute]`] = 'status'
    params[`where[${i}][value]`]     = status
    i++
  }
  if (type !== 'all') {
    params[`where[${i}][type]`]      = 'equals'
    params[`where[${i}][attribute]`] = 'type'
    params[`where[${i}][value]`]     = type
    i++
  }
  if (priceRange !== 'all') {
    const { min, max } = PRICE_BOUNDS[priceRange]
    if (min !== undefined) {
      params[`where[${i}][type]`]      = 'greaterThanOrEquals'
      params[`where[${i}][attribute]`] = 'price'
      params[`where[${i}][value]`]     = String(min)
      i++
    }
    if (max !== undefined) {
      params[`where[${i}][type]`]      = 'lessThan'
      params[`where[${i}][attribute]`] = 'price'
      params[`where[${i}][value]`]     = String(max)
      i++
    }
  }
  if (areaRange !== 'all') {
    const { min, max } = AREA_BOUNDS[areaRange]
    if (min !== undefined) {
      params[`where[${i}][type]`]      = 'greaterThanOrEquals'
      params[`where[${i}][attribute]`] = 'square'
      params[`where[${i}][value]`]     = String(min)
      i++
    }
    if (max !== undefined) {
      params[`where[${i}][type]`]      = 'lessThan'
      params[`where[${i}][attribute]`] = 'square'
      params[`where[${i}][value]`]     = String(max)
      i++
    }
  }
  return params
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

  const { data, isFetching, refetch } = useQuery<EspoListResponse<RealEstateProperty>>({
    queryKey: [
      QUERY_KEY, page, pageSize,
      debouncedSearch, filters.status, filters.type, filters.sortBy,
      filters.priceRange, filters.areaRange,
    ],
    queryFn: async () => {
      const { orderBy, order } = SORT_MAP[filters.sortBy]
      const whereParams = buildWhereParams(
        debouncedSearch, filters.status, filters.type,
        filters.priceRange, filters.areaRange,
      )
      const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
        params: { maxSize: pageSize, offset: (page - 1) * pageSize, orderBy, order, ...whereParams },
      })
      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  // KPI counts — 4 parallel requests, maxSize:1 to minimise payload, read total only
  const { data: kpiData } = useQuery({
    queryKey: [QUERY_KEY, 'kpi'],
    queryFn: async () => {
      const fetchCount = (status: string) =>
        axiosClient
          .get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
            params: {
              maxSize: 1,
              'where[0][type]': 'equals',
              'where[0][attribute]': 'status',
              'where[0][value]': status,
            },
          })
          .then(r => r.data.total)

      const [available, pending, underApproval, sold] = await Promise.all([
        fetchCount('Available'),
        fetchCount('Pending'),
        fetchCount('Under Approval'),
        fetchCount('Sold'),
      ])
      return { available, pending: pending + underApproval, sold }
    },
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
    mutationFn: (id: string) => axiosClient.delete(`/RealEstateProperty/${id}`),
    onSuccess: () => {
      toast.success('Property deleted')
      refetch()
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'kpi'] })
    },
    onError: () => {
      toast.error('Failed to delete property')
    },
  })

  const onSearchChange     = useCallback((search: string)        => { setFilters(f => ({ ...f, search }));        setPage(1) }, [])
  const onStatusChange     = useCallback((status: string)        => { setFilters(f => ({ ...f, status }));        setPage(1) }, [])
  const onTypeChange       = useCallback((type: string)          => { setFilters(f => ({ ...f, type }));          setPage(1) }, [])
  const onSortChange       = useCallback((sortBy: SortOption)    => { setFilters(f => ({ ...f, sortBy }));        setPage(1) }, [])
  const onPriceRangeChange = useCallback((priceRange: PriceRange)=> { setFilters(f => ({ ...f, priceRange }));    setPage(1) }, [])
  const onAreaRangeChange  = useCallback((areaRange: AreaRange)  => { setFilters(f => ({ ...f, areaRange }));     setPage(1) }, [])
  const onClearFilters     = useCallback(()                      => { setFilters(DEFAULT_FILTERS);                 setPage(1) }, [])
  const onViewModeChange   = useCallback((mode: ViewMode)        => setViewMode(mode), [])
  const onPageChange       = useCallback((p: number)             => setPage(p), [])
  const onPageSizeChange   = useCallback((size: PageSizeOption)  => { setPageSize(size); setPage(1) }, [])

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
