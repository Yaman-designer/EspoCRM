'use client'

import { memo } from 'react'
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
}: PropertyGridProps) {
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
      <div className="grid grid-cols-2 gap-4 @[600px]:grid-cols-3 @[1100px]:grid-cols-4 @[1280px]:grid-cols-5 @[1560px]:grid-cols-6">
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
