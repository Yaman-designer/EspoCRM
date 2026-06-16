'use client'

import { memo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
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
  isError?:   boolean
  savedOnly?: boolean
  onRetry?:   () => void
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
  onRetry,
}: PropertyGridProps) {
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
            {savedOnly ? 'Unable to load saved properties.' : 'Unable to load properties.'}
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            {savedOnly
              ? 'The saved properties filter could not complete. Check the browser console for the request duration and HTTP status.'
              : 'An error occurred while fetching properties. Please try again.'}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Retry
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
        onClearFilters={onClearFilters}
        onAddProperty={onAddProperty}
      />
    )
  }

  // List view — @container grid so column count tracks content-area width.
  //
  // Priority is readability over density: each card needs enough width for the
  // horizontal image + content layout to breathe. Breakpoints:
  //   default        → 1 col  (mobile / tablet, full-width card)
  //   @[920px]       → 2 cols (desktop sidebar open ≈ 1160px → each card ≈ 570px)
  //   @[1500px]      → 3 cols (ultra-wide / 1920p screens)
  if (viewMode === 'list') {
    return (
      <div className="@container w-full">
        <div className="grid grid-cols-1 gap-4 @[920px]:grid-cols-2 @[1500px]:grid-cols-3">
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

  // Grid view — column count locked to actual content-area width via @container.
  //
  // Layout math (1440px screen, md:p-6 = 24px each side, sidebar inset = sidebar + 12px):
  //   Sidebar open  (220+12+48 = 280px overhead): content ≈ 1160px → 4 cols
  //   Sidebar closed (64+12+48 = 124px overhead): content ≈ 1316px → 5 cols
  //
  // Breakpoints derived from content widths — NOT viewport widths.
  // @[600px]  → tablet: 3 cols (card ≈ 192px)
  // @[1100px] → desktop sidebar open: 4 cols  (card ≈ 278px at 1160px)
  // @[1280px] → desktop sidebar closed: 5 cols (card ≈ 250px at 1316px)
  // @[1560px] → large screen: 6 cols
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-x-2 gap-y-4 @[600px]:grid-cols-3 @[600px]:gap-4 @[1100px]:grid-cols-4 @[1280px]:grid-cols-5 @[1560px]:grid-cols-6">
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
