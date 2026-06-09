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

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-2.5">
        {properties.map(p => (
          <PropertyListRow
            key={p.id}
            property={p}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  // Grid view — container queries so column count tracks actual content-area width,
  // not viewport width (sidebar width eats into available space on desktop).
  // Thresholds guarantee ≥280px card width at every multi-column breakpoint:
  //   default         → 2 cols, 12px gap  (mobile / narrow containers)
  //   container≥872px → 3 cols, 16px gap  (3×280 + 2×16 = 872px)
  //   container≥1168px→ 4 cols, 20px gap  (4×280 + 3×16 = 1168px)
  //   container≥1464px→ 5 cols, 24px gap  (5×280 + 4×16 = 1464px)
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-3 @[872px]:grid-cols-3 @[872px]:gap-4 @[1168px]:grid-cols-4 @[1168px]:gap-5 @[1464px]:grid-cols-5 @[1464px]:gap-6">
        {properties.map(p => (
          <PropertyCard
            key={p.id}
            property={p}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
})
