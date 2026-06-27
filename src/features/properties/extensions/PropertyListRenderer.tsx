'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { PropertyToolbar } from '../components/PropertyToolbar'
import { PropertyGrid } from '../components/PropertyGrid'
import { PropertyPagination } from '../components/PropertyPagination'
import { buildWhereParams, SORT_MAP } from '../services/property.query.service'
import { fetchProperties } from '../repositories/property.repository'
import { PROPERTIES_QUERY_KEY, PAGE_SIZE_OPTIONS, type PageSizeOption } from '../domain/constants'
import { useFavoriteIds } from '../hooks/useFavoriteState'
import type { PropertyFilters, SortOption, ViewMode } from '../types/property.types'
import type { RealEstateProperty } from '../types/property.types'
import type { ListRendererProps } from '@/components/crud/resource-extensions'

// ── PropertyListRenderer ──────────────────────────────────────────────────────
//
// CRMResourcePage extension that replaces the standard DataTable for the
// Properties entity. Manages its own filter state, debounced search, server-side
// query (buildWhereParams → EspoCRM WHERE clauses), and pagination.
//
// State is persisted to the URL via history.replaceState so the user can
// refresh or share a filtered view and land in exactly the same context.

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

// ── URL helpers ───────────────────────────────────────────────────────────────

function readFiltersFromUrl(): PropertyFilters {
  if (typeof window === 'undefined') return DEFAULT_FILTERS
  const p = new URLSearchParams(window.location.search)
  return {
    search:    p.get('q')    ?? '',
    type:      p.get('type') ?? 'all',
    savedOnly: p.get('saved') === 'true',
    bedrooms:  p.has('beds')     ? (Number(p.get('beds'))     || null) : null,
    bathrooms: p.has('baths')    ? (Number(p.get('baths'))    || null) : null,
    minPrice:  p.has('minPrice') ? (Number(p.get('minPrice')) || null) : null,
    maxPrice:  p.has('maxPrice') ? (Number(p.get('maxPrice')) || null) : null,
    sortBy:    (p.get('sort') as SortOption) ?? 'newest',
  }
}

function readPageFromUrl(): number {
  if (typeof window === 'undefined') return 1
  return Math.max(1, Number(new URLSearchParams(window.location.search).get('page')) || 1)
}

function readViewModeFromUrl(): ViewMode {
  if (typeof window === 'undefined') return 'grid'
  return (new URLSearchParams(window.location.search).get('view') as ViewMode) ?? 'grid'
}

function readPageSizeFromUrl(): PageSizeOption {
  if (typeof window === 'undefined') return PAGE_SIZE_OPTIONS[0]
  const v = Number(new URLSearchParams(window.location.search).get('perPage'))
  return PAGE_SIZE_OPTIONS.includes(v as PageSizeOption) ? (v as PageSizeOption) : PAGE_SIZE_OPTIONS[0]
}

// ─────────────────────────────────────────────────────────────────────────────

export function PropertyListRenderer({
  onEdit, onDelete, onAdd,
}: ListRendererProps<RealEstateProperty>) {

  const router = useRouter()

  // Navigate to the full detail page instead of opening the legacy side sheet.
  const onView = useCallback((p: RealEstateProperty) => {
    const slug = p.propertyCode?.toLowerCase() ?? p.id
    router.push(`/properties/${encodeURIComponent(slug)}`)
  }, [router])

  // ── Favorites (localStorage) ──────────────────────────────────────────────
  const favoriteIds = useFavoriteIds()

  // ── Filter / pagination state ─────────────────────────────────────────────

  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  // ── URL state persistence ─────────────────────────────────────────────────
  // On mount: restore state from URL (so refresh / back button work).
  // On change: write back to URL via replaceState (no full navigation).
  //
  // syncCount guards against overwriting the URL with default values on the
  // very first render, before the mount effect has run and set real values.
  const syncCount = useRef(0)

  useEffect(() => {
    setFilters(readFiltersFromUrl())
    setPage(readPageFromUrl())
    setViewMode(readViewModeFromUrl())
    setPageSize(readPageSizeFromUrl())
  }, [])

  useEffect(() => {
    syncCount.current++
    if (syncCount.current <= 1) return // skip the pre-init render

    const p = new URLSearchParams()
    if (filters.search)              p.set('q',        filters.search)
    if (filters.type !== 'all')      p.set('type',     filters.type)
    if (filters.savedOnly)           p.set('saved',    'true')
    if (filters.bedrooms  !== null)  p.set('beds',     String(filters.bedrooms))
    if (filters.bathrooms !== null)  p.set('baths',    String(filters.bathrooms))
    if (filters.minPrice  !== null)  p.set('minPrice', String(filters.minPrice))
    if (filters.maxPrice  !== null)  p.set('maxPrice', String(filters.maxPrice))
    if (filters.sortBy !== 'newest') p.set('sort',     filters.sortBy)
    if (page > 1)                    p.set('page',     String(page))
    if (viewMode !== 'grid')         p.set('view',     viewMode)
    if (pageSize !== PAGE_SIZE_OPTIONS[0]) p.set('perPage', String(pageSize))

    const qs = p.toString()
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [filters, page, viewMode, pageSize])

  // ── Debounced search ──────────────────────────────────────────────────────

  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [
      PROPERTIES_QUERY_KEY, page, pageSize,
      debouncedSearch, filters.type, filters.savedOnly,
      filters.bedrooms, filters.bathrooms,
      filters.minPrice, filters.maxPrice, filters.sortBy,
      filters.savedOnly ? favoriteIds : null,
    ],
    queryFn: async () => {
      const { orderBy, order } = SORT_MAP[filters.sortBy]

      if (filters.savedOnly && favoriteIds.length === 0) {
        return { list: [] as RealEstateProperty[], total: 0 }
      }

      const whereParams = buildWhereParams(
        debouncedSearch,
        filters.type,
        filters.savedOnly ? favoriteIds : null,
        filters.bedrooms,
        filters.bathrooms,
        filters.minPrice,
        filters.maxPrice,
      )
      const params = { maxSize: pageSize, offset: (page - 1) * pageSize, orderBy, order }
      return fetchProperties(params, whereParams)
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const properties  = data?.list ?? EMPTY_PROPERTIES
  const totalCount  = data?.total ?? 0
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize))
  const isLoading   = data === undefined
  const isSavedFetching = filters.savedOnly && isFetching

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages)
  }, [totalCount, page, totalPages])

  const hasFilters =
    filters.search    !== ''    ||
    filters.type      !== 'all' ||
    filters.savedOnly           ||
    filters.bedrooms  !== null  ||
    filters.bathrooms !== null  ||
    filters.minPrice  !== null  ||
    filters.maxPrice  !== null

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const onSearchChange    = useCallback((search: string)         => { setFilters(f => ({ ...f, search }));    setPage(1) }, [])
  const onTypeChange      = useCallback((type: string)           => { setFilters(f => ({ ...f, type }));      setPage(1) }, [])
  const onSavedOnlyChange = useCallback((savedOnly: boolean)     => { setFilters(f => ({ ...f, savedOnly })); setPage(1) }, [])
  const onBedroomsChange  = useCallback((bedrooms: number|null)  => { setFilters(f => ({ ...f, bedrooms }));  setPage(1) }, [])
  const onBathroomsChange = useCallback((bathrooms: number|null) => { setFilters(f => ({ ...f, bathrooms })); setPage(1) }, [])
  const onPriceChange     = useCallback((minPrice: number|null, maxPrice: number|null) => {
    setFilters(f => ({ ...f, minPrice, maxPrice })); setPage(1)
  }, [])
  const onSortChange      = useCallback((sortBy: SortOption)    => { setFilters(f => ({ ...f, sortBy }));    setPage(1) }, [])
  const onClearFilters    = useCallback(()                       => { setFilters(DEFAULT_FILTERS);             setPage(1) }, [])
  const onViewModeChange  = useCallback((mode: ViewMode)         => setViewMode(mode), [])
  const onPageChange      = useCallback((p: number)             => setPage(p), [])
  const onPageSizeChange  = useCallback((size: PageSizeOption)  => { setPageSize(size); setPage(1) }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 bg-background px-0 sm:px-2 pt-5 sm:pt-8 pb-3 sm:pb-5">
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

      {/* Scrollable content */}
      <div className="flex flex-col gap-4 px-0 sm:px-2 pt-3 pb-4 sm:py-5">

        {/* Saved mode — dedicated collection workspace header */}
        {filters.savedOnly && (
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-50">
                <Heart
                  className="size-4 text-rose-500"
                  style={{ fill: 'rgba(244,63,94,0.10)', strokeWidth: 1.75 }}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[15px] font-semibold leading-none tracking-tight text-foreground">
                  Saved Properties
                </h2>
                {!isLoading && (
                  <p className="mt-0.5 text-[12px] leading-none text-muted-foreground">
                    {favoriteIds.length === 0
                      ? 'No properties saved yet'
                      : `${favoriteIds.length} ${favoriteIds.length === 1 ? 'property' : 'properties'} in your collection`
                    }
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[12px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Browse all →
            </button>
          </div>
        )}

        {/* Results context — active filter / search summary above the grid */}
        {!isLoading && !filters.savedOnly && totalCount > 0 && hasFilters && (
          <div className="flex items-center gap-2 text-[12.5px]">
            {filters.search.trim() ? (
              <span className="text-muted-foreground">
                Results for{' '}
                <span className="font-semibold text-foreground">&ldquo;{filters.search}&rdquo;</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Filtered results</span>
            )}
            <span className="select-none text-border" aria-hidden>·</span>
            <span className="font-semibold tabular-nums text-foreground">{totalCount.toLocaleString()}</span>
            <span className="text-muted-foreground">{totalCount === 1 ? 'property' : 'properties'}</span>
          </div>
        )}

        <div className="min-h-75">
          <PropertyGrid
            properties={properties}
            viewMode={viewMode}
            isLoading={isLoading}
            hasActiveFilters={hasFilters}
            savedOnly={filters.savedOnly}
            searchQuery={filters.search}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onClearFilters={onClearFilters}
            onAddProperty={onAdd}
            isError={isError}
            onRetry={refetch}
          />
        </div>

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
