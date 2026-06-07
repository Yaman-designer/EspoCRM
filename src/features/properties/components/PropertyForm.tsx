'use client'

import { Building2 } from 'lucide-react'
import { DynamicForm } from '@/components/dynamic-form'
import { propertySchema } from '../schema'
import { propertySections } from '../fields'
import type { RealEstateProperty } from '../types/property.types'

interface PropertyFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: Partial<RealEstateProperty>
  mode?: 'create' | 'edit'
}

export function PropertyForm({
  open,
  onClose,
  onSuccess,
  initialData,
  mode = 'create',
}: PropertyFormProps) {
  return (
    <DynamicForm<RealEstateProperty>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={mode === 'edit' ? 'Edit Property' : 'Add New Property'}
      description={
        mode === 'edit'
          ? 'Update property details in your portfolio.'
          : 'Add a new property to your portfolio.'
      }
      icon={Building2}
      sections={propertySections}
      schema={propertySchema}
      endpoint="/RealEstateProperty"
      initialData={initialData}
      mode={mode}
      maxWidth="2xl"
    />
  )
}
