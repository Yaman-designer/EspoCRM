'use client'

import { memo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PropertyCard, PropertyListRow } from './PropertyCard'
import { PropertySkeletonGrid, PropertySkeletonList } from './PropertySkeleton'
import { PropertyEmptyState } from './PropertyEmptyState'
import type { Property, ViewMode } from '../types/property.types'

interface PropertyGridProps {
  properties: Property[]
  viewMode: ViewMode
  isLoading: boolean
  hasActiveFilters: boolean
  onView: (property: Property) => void
  onEdit: (property: Property) => void
  onDelete: (property: Property) => void
  onDuplicate?: (property: Property) => void
  onClearFilters: () => void
  onAddProperty: () => void
  // Error state — takes precedence over isLoading to prevent infinite skeleton
  isError?:     boolean
  savedOnly?:   boolean
  searchQuery?: string
  onRetry?:     () => void
}

export const PropertyGrid = memo(function PropertyGrid({
  properties,
  viewMode,
  isLoading,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onClearFilters,
  onAddProperty,
  isError = false,
  savedOnly = false,
  searchQuery = '',
  onRetry,
}: PropertyGridProps) {
  const { t } = useTranslation('properties')
  // Error branch must come before isLoading: when the query errors, data becomes
  // undefined which makes isLoading=true, causing the skeleton to show forever.
  if (isError) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-destructive/25 bg-destructive/4 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/8">
          <AlertCircle className="size-6 text-destructive/70" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-semibold text-foreground">
            {savedOnly ? t('grid.unableToLoadSaved') : t('grid.unableToLoad')}
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            {savedOnly ? t('grid.savedError') : t('grid.genericError')}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            {t('grid.retry')}
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return viewMode === 'list'
      ? <PropertySkeletonList count={6} />
      : <PropertySkeletonGrid count={10} />
  }

  if (properties.length === 0) {
    return (
      <PropertyEmptyState
        hasActiveFilters={hasActiveFilters}
        savedOnly={savedOnly}
        searchQuery={searchQuery}
        onClearFilters={onClearFilters}
        onAddProperty={onAddProperty}
      />
    )
  }

  // Enterprise UI/UX Architecture Refinement (2026-07-24). Both grids used to
  // pick a column COUNT at fixed content-width breakpoints
  // (`@[600px]:grid-cols-3`, etc.) — a step function that forces every card
  // in a row into whatever width N columns happens to divide the available
  // space into, even when that's narrower than the card's own content
  // needs. Live-measured this pass: the grid view's `@[600px]:grid-cols-3`
  // tier put real cards at ~192-232px — narrow enough that the desktop
  // StatChip row (3 icon+value+label chips) reads as compressed. Both grids
  // now use `repeat(auto-fill, minmax(MIN, 1fr))` instead: the browser fits
  // as many columns as actually satisfy MIN, wrapping to fewer (never
  // fewer than 1) the moment they wouldn't — column count is an emergent
  // property of the available width, not a hand-picked breakpoint ladder,
  // and no card can ever be forced narrower than MIN regardless of how
  // many properties are in the list or how wide the screen is.
  //
  // auto-fill (not auto-fit): auto-fit collapses empty tracks and hands
  // their space to whatever cards exist via the `1fr` upper bound — with
  // 1-3 properties that stretches the existing cards to fill the row.
  // auto-fill keeps the unused tracks in the layout so leftover space stays
  // empty on the right instead, regardless of item count.

  // List view — each card lays out a horizontal image + content row side by
  // side (see PropertyListRow below); --card-list-min-w (globals.css) is the
  // narrowest width that combination reads comfortably at, live-verified
  // against the existing w-36/w-52 image rail.
  if (viewMode === 'list') {
    return (
      <div className="w-full">
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(var(--card-list-min-w),1fr))]">
          {properties.map(p => (
            <PropertyListRow
              key={p.id}
              property={p}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      </div>
    )
  }

  // Grid view — --card-grid-min-w (globals.css) is a live-measured floor:
  // comfortably above the ~232px width where the desktop (sm:) StatChip row
  // and footer ghost buttons started reading as tight, with real margin
  // rather than the narrowest width that merely still technically fits.
  //
  // Plain `auto-fit, minmax(var(--card-grid-min-w), 1fr)` has no upper bound
  // on column count: on an ultra-wide desktop the container comfortably fits
  // 6+ tracks at that floor, so cards get needlessly numerous instead of
  // staying at a predictable max (Stripe/Linear/Airbnb-style dashboards cap
  // at 4). The `max(floor, (100% - 3*gap)/4)` track-size trick forces a 5th
  // column to never fit — once the container is wide enough for four tracks
  // above the floor, the floor itself grows to exactly one quarter of the
  // available width, so auto-fit always resolves to exactly 4. Below that
  // width the max() collapses back to the flat floor and auto-fit reduces
  // columns (4→3→2→1) exactly as before — the floor is never violated, so a
  // card can never compress smaller than --card-grid-min-w at any width.
  return (
    <div className="w-full">
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(max(var(--card-grid-min-w),(100%_-_3rem)/4),1fr))]">
        {properties.map(p => (
          <PropertyCard
            key={p.id}
            property={p}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    </div>
  )
})
