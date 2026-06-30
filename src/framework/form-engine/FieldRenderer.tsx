'use client'

import type { UseFormReturn } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'
import { resolveField } from './FieldRegistry'
import type { FieldSchema, FieldOption } from './types'

interface FieldRendererProps {
  field: FieldSchema
  form: UseFormReturn<any>
  disabled?: boolean
  readOnly?: boolean
  /** Dynamic options from the dependency engine */
  options?: FieldOption[]
}

/**
 * Routes a FieldSchema to its registered component.
 * Renders an error chip for unregistered types instead of crashing.
 */
export function FieldRenderer({ field, form, disabled, readOnly, options }: FieldRendererProps) {
  const registration = resolveField(field.type)

  if (!registration) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>
          Unknown field type: <strong>{field.type}</strong> (key: {field.key})
        </span>
      </div>
    )
  }

  const Component = registration.component

  return (
    <Component
      schema={field}
      form={form}
      disabled={disabled}
      readOnly={readOnly}
      options={options}
    />
  )
}
