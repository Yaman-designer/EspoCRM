'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type {
  RealEstateProperty,
  PropertyFilters,
  SortOption,
  ViewMode,
} from '../types/property.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const QUERY_KEY = 'realEstateProperties'

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number]

const DEFAULT_FILTERS: PropertyFilters = {
  search: '',
  status: 'all',
  type:   'all',
  sortBy: 'newest',
}

const SORT_MAP: Record<SortOption, { orderBy: string; order: 'asc' | 'desc' }> = {
  newest:       { orderBy: 'createdAt', order: 'desc' },
  oldest:       { orderBy: 'createdAt', order: 'asc'  },
  'price-high': { orderBy: 'price',     order: 'desc' },
  'price-low':  { orderBy: 'price',     order: 'asc'  },
}

function buildWhereParams(
  search: string,
  status: string,
  type: string,
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
  return params
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProperties() {
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
    queryKey: [QUERY_KEY, page, pageSize, debouncedSearch, filters.status, filters.type, filters.sortBy],
    queryFn: async () => {
      const { orderBy, order } = SORT_MAP[filters.sortBy]
      const whereParams = buildWhereParams(debouncedSearch, filters.status, filters.type)

      const res = await axiosClient.get<EspoListResponse<RealEstateProperty>>('/RealEstateProperty', {
        params: {
          maxSize: pageSize,
          offset: (page - 1) * pageSize,
          orderBy,
          order,
          ...whereParams,
        },
      })

      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const properties  = data?.list ?? []
  const totalCount  = data?.total ?? 0
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasFilters  = filters.search !== '' || filters.status !== 'all' || filters.type !== 'all'
  const isLoading   = data === undefined

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/RealEstateProperty/${id}`),
    onSuccess: () => {
      toast.success('Property deleted')
      refetch()
    },
    onError: () => {
      toast.error('Failed to delete property')
    },
  })

  const onSearchChange    = useCallback((search: string)    => { setFilters(f => ({ ...f, search }));   setPage(1) }, [])
  const onStatusChange    = useCallback((status: string)    => { setFilters(f => ({ ...f, status }));   setPage(1) }, [])
  const onTypeChange      = useCallback((type: string)      => { setFilters(f => ({ ...f, type }));     setPage(1) }, [])
  const onSortChange      = useCallback((sortBy: SortOption)=> { setFilters(f => ({ ...f, sortBy }));   setPage(1) }, [])
  const onClearFilters    = useCallback(()                  => { setFilters(DEFAULT_FILTERS);            setPage(1) }, [])
  const onViewModeChange  = useCallback((mode: ViewMode)    => setViewMode(mode), [])
  const onPageChange      = useCallback((p: number)         => setPage(p), [])
  const onPageSizeChange  = useCallback((size: PageSizeOption) => { setPageSize(size); setPage(1) }, [])

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
    onClearFilters,
    onViewModeChange,
    refetch,
    deleteMutation,
  }
}

export { PAGE_SIZE_OPTIONS }
