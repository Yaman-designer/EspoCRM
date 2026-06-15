'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { PropertyToolbar } from '../components/PropertyToolbar'
import { PropertyGrid } from '../components/PropertyGrid'
import { PropertyPagination } from '../components/PropertyPagination'
import { buildWhereParams, SORT_MAP } from '../services/property.query.service'
import { fetchProperties } from '../repositories/property.repository'
import { PROPERTIES_QUERY_KEY, PAGE_SIZE_OPTIONS, type PageSizeOption } from '../domain/constants'
import type { PropertyFilters, SortOption, ViewMode, PriceRange, AreaRange } from '../types/property.types'
import type { RealEstateProperty } from '../types/property.types'
import type { ListRendererProps } from '@/components/crud/resource-extensions'

// ── PropertyListRenderer ──────────────────────────────────────────────────────
//
// CRMResourcePage extension that replaces the standard DataTable for the
// Properties entity. Manages its own filter state, debounced search, server-side
// query (buildWhereParams → EspoCRM WHERE clauses), and pagination.
//
// Receives CRUD action callbacks from the framework — onView / onEdit / onDelete
// open framework-managed dialogs; onAdd opens the framework's DynamicForm in
// create mode so all mutations stay inside CRMResourcePage.

const DEFAULT_FILTERS: PropertyFilters = {
  search: '', status: 'all', type: 'all', sortBy: 'newest', priceRange: 'all', areaRange: 'all',
}

export function PropertyListRenderer({
  onView, onEdit, onDelete, onAdd,
}: ListRendererProps<RealEstateProperty>) {

  // Returns false on server / first hydration pass, true on the client after
  // hydration — avoids React Query cache causing isLoading=false before mount.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  // ── Filter / pagination state ─────────────────────────────────────────────

  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  // 350 ms debounce on search to avoid a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  // ── Data fetching ─────────────────────────────────────────────────────────
  // Each unique filter combination gets its own cache entry; keepPreviousData
  // prevents the grid from blanking between page turns.

  const { data, isFetching } = useQuery({
    queryKey: [
      PROPERTIES_QUERY_KEY, page, pageSize,
      debouncedSearch, filters.status, filters.type, filters.sortBy,
      filters.priceRange, filters.areaRange,
    ],
    queryFn: () => {
      const { orderBy, order } = SORT_MAP[filters.sortBy]
      const whereParams = buildWhereParams(
        debouncedSearch, filters.status, filters.type, filters.priceRange, filters.areaRange,
      )
      return fetchProperties(
        { maxSize: pageSize, offset: (page - 1) * pageSize, orderBy, order },
        whereParams,
      )
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const properties = data?.list ?? []
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const isLoading  = !mounted || data === undefined
  const hasFilters =
    filters.search     !== '' ||
    filters.status     !== 'all' ||
    filters.type       !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.areaRange  !== 'all'

  // ── Callbacks (stable — all reset page to 1 on filter change) ────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">

      {/* Sticky toolbar — blurs page content scrolling beneath it */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <PropertyToolbar
          search={filters.search}
          onSearchChange={onSearchChange}
          statusFilter={filters.status}
          onStatusChange={onStatusChange}
          typeFilter={filters.type}
          onTypeChange={onTypeChange}
          sortBy={filters.sortBy}
          onSortChange={onSortChange}
          priceRange={filters.priceRange}
          onPriceRangeChange={onPriceRangeChange}
          areaRange={filters.areaRange}
          onAreaRangeChange={onAreaRangeChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          totalCount={totalCount}
          onAddProperty={onAdd}
          hasActiveFilters={hasFilters}
          onClearFilters={onClearFilters}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex flex-col gap-4 px-4 sm:px-6 py-4 sm:py-5">
        <PropertyGrid
          properties={properties}
          viewMode={viewMode}
          isLoading={isLoading}
          hasActiveFilters={hasFilters}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onClearFilters={onClearFilters}
          onAddProperty={onAdd}
        />
        <PropertyPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          isFetching={isFetching}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>

    </div>
  )
}
