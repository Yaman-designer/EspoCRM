'use client'

import { PropertyDetailsSheet } from '../components/PropertyDetailsSheet'
import type { RealEstateProperty } from '../types/property.types'
import type { ViewRendererProps } from '@/components/crud/resource-extensions'

/**
 * Thin adapter that connects CRMResourcePage's ViewRendererProps contract to
 * PropertyDetailsSheet's prop names. PropertyDetailsSheet manages its own
 * <Sheet open={!!property}> so it serves as a complete sheet replacement.
 */
export function PropertyViewRenderer({
  row, onClose, onEdit, onDelete,
}: ViewRendererProps<RealEstateProperty>) {
  return (
    <PropertyDetailsSheet
      property={row ?? null}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
