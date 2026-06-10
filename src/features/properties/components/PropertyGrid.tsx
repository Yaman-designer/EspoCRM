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
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    )
  }

  // Grid view — container queries so column count tracks actual content-area width,
  // not viewport width (sidebar width eats into available space on desktop).
  //
  // Each threshold = N×280 + (N-1)×16, capping cards at ≤280px before each step-up:
  //   default          → 2 cols  (≤575px  container — mobile / very narrow)
  //   container≥576px  → 3 cols  (3×280 + 2×16 = 872px  before step-up)
  //   container≥872px  → 4 cols  (4×280 + 3×16 = 1168px before step-up)
  //   container≥1168px → 5 cols  (5×280 + 4×16 = 1464px before step-up)
  //   container≥1464px → 6 cols  (enterprise large-screen density)
  //
  // Gap is constant gap-4 (16px) to prevent visual jumps during resize.
  // Do NOT switch to auto-fit/minmax — it stretches cards when rows are sparse.
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-4 @[576px]:grid-cols-3 @[872px]:grid-cols-4 @[1168px]:grid-cols-5 @[1464px]:grid-cols-6">
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
