'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PropertyToolbar } from '../components/PropertyToolbar'
import { PropertyGrid } from '../components/PropertyGrid'
import { PropertyPagination } from '../components/PropertyPagination'
import { buildWhereParams, SORT_MAP } from '../services/property.query.service'
import { fetchProperties } from '../repositories/property.repository'
import { PROPERTIES_QUERY_KEY, PAGE_SIZE_OPTIONS, type PageSizeOption } from '../domain/constants'
import type { PropertyFilters, SortOption, ViewMode } from '../types/property.types'
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

const EMPTY_PROPERTIES: RealEstateProperty[] = []

const DEFAULT_FILTERS: PropertyFilters = {
  search:    '',
  type:      'all',
  savedOnly: false,
  bedrooms:  null,
  bathrooms: null,
  minPrice:  null,
  maxPrice:  null,
  sortBy:    'newest',
}

export function PropertyListRenderer({
  onView, onEdit, onDelete, onAdd,
}: ListRendererProps<RealEstateProperty>) {

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

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [
      PROPERTIES_QUERY_KEY, page, pageSize,
      debouncedSearch, filters.type, filters.savedOnly,
      filters.bedrooms, filters.bathrooms,
      filters.minPrice, filters.maxPrice, filters.sortBy,
    ],
    queryFn: async () => {
      const { orderBy, order } = SORT_MAP[filters.sortBy]
      const whereParams = buildWhereParams(
        debouncedSearch,
        filters.type,
        filters.savedOnly,
        filters.bedrooms,
        filters.bathrooms,
        filters.minPrice,
        filters.maxPrice,
      )
      const params = { maxSize: pageSize, offset: (page - 1) * pageSize, orderBy, order }

      if (filters.savedOnly) {
        const t0 = performance.now()
        try {
          const result = await fetchProperties(params, whereParams)
          const ms = Math.round(performance.now() - t0)
          console.log(`[Saved filter] ${ms}ms | success | ${result.list.length} of ${result.total} properties`)
          return result
        } catch (err: unknown) {
          const ms = Math.round(performance.now() - t0)
          console.error(`[Saved filter] ${ms}ms | FAILED`, err)
          throw err
        }
      }

      return fetchProperties(params, whereParams)
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const properties      = data?.list ?? EMPTY_PROPERTIES
  const totalCount      = data?.total ?? 0
  const totalPages      = Math.max(1, Math.ceil(totalCount / pageSize))
  const isLoading       = data === undefined
  // Show spinner on the Saved chip + loading banner above grid only while
  // a savedOnly query is in-flight and we already have previous data to display.
  const isSavedFetching = filters.savedOnly && isFetching
  const hasFilters      =
    filters.search    !== ''   ||
    filters.type      !== 'all' ||
    filters.savedOnly          ||
    filters.bedrooms  !== null  ||
    filters.bathrooms !== null  ||
    filters.minPrice  !== null  ||
    filters.maxPrice  !== null

  // ── Callbacks (stable — all reset page to 1 on filter change) ────────────

  const onSearchChange    = useCallback((search: string)         => { setFilters(f => ({ ...f, search }));    setPage(1) }, [])
  const onTypeChange      = useCallback((type: string)           => { setFilters(f => ({ ...f, type }));      setPage(1) }, [])
  const onSavedOnlyChange = useCallback((savedOnly: boolean)     => { setFilters(f => ({ ...f, savedOnly })); setPage(1) }, [])
  const onBedroomsChange  = useCallback((bedrooms: number|null)  => { setFilters(f => ({ ...f, bedrooms }));  setPage(1) }, [])
  const onBathroomsChange = useCallback((bathrooms: number|null) => { setFilters(f => ({ ...f, bathrooms })); setPage(1) }, [])
  const onPriceChange     = useCallback((minPrice: number|null, maxPrice: number|null) => {
    setFilters(f => ({ ...f, minPrice, maxPrice })); setPage(1)
  }, [])
  const onSortChange      = useCallback((sortBy: SortOption)     => { setFilters(f => ({ ...f, sortBy }));    setPage(1) }, [])
  const onClearFilters    = useCallback(()                       => { setFilters(DEFAULT_FILTERS);             setPage(1) }, [])
  const onViewModeChange  = useCallback((mode: ViewMode)         => setViewMode(mode), [])
  const onPageChange      = useCallback((p: number)             => setPage(p), [])
  const onPageSizeChange  = useCallback((size: PageSizeOption)  => { setPageSize(size); setPage(1) }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">

      {/* Sticky toolbar — blurs page content scrolling beneath it */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/30 px-0 sm:px-2 pt-4 sm:pt-6 pb-4">
        <PropertyToolbar
          search={filters.search}
          onSearchChange={onSearchChange}
          typeFilter={filters.type}
          onTypeChange={onTypeChange}
          savedOnly={filters.savedOnly}
          onSavedOnlyChange={onSavedOnlyChange}
          bedrooms={filters.bedrooms}
          onBedroomsChange={onBedroomsChange}
          bathrooms={filters.bathrooms}
          onBathroomsChange={onBathroomsChange}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onPriceChange={onPriceChange}
          sortBy={filters.sortBy}
          onSortChange={onSortChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          totalCount={totalCount}
          onAddProperty={onAdd}
          hasActiveFilters={hasFilters}
          onClearFilters={onClearFilters}
          isSavedFetching={isSavedFetching}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex flex-col gap-4 px-0 sm:px-2 py-4 sm:py-5">

        {/* Loading banner — shown when savedOnly is active and a new page of results
            is loading, but we have stale data already displayed via keepPreviousData */}
        {isSavedFetching && data !== undefined && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-600">
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
            <span>Loading saved properties…</span>
          </div>
        )}

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
          isError={isError}
          savedOnly={filters.savedOnly}
          onRetry={refetch}
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
