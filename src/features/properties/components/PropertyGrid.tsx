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
      : <PropertySkeletonGrid count={8} />
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
  )
})
