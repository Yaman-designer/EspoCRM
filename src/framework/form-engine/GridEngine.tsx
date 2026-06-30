'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { FieldSchema, FieldOption } from './types'
import { isFieldVisible } from './VisibilityEngine'
import { getGridClasses } from './utils'
import { FieldRenderer } from './FieldRenderer'

interface GridEngineProps {
  fields: FieldSchema[]
  form: UseFormReturn<any>
  watchedValues: Record<string, unknown>
  fieldOptions: Record<string, FieldOption[]>
  permissions?: string[]
}

/**
 * Renders a 12-column responsive grid of fields.
 * Handles: visibility evaluation, disabled/readOnly resolution, span classes.
 */
export function GridEngine({
  fields,
  form,
  watchedValues,
  fieldOptions,
  permissions = [],
}: GridEngineProps) {
  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-7 sm:gap-y-6">
      {fields.map(field => {
        // Hidden fields render nothing visible but stay in the DOM for form registration
        if (field.type === 'hidden') {
          return (
            <div key={field.key} className="hidden">
              <FieldRenderer field={field} form={form} options={[]} />
            </div>
          )
        }

        // Permission check (read access)
        if (field.permissions?.read?.length) {
          const hasRead = field.permissions.read.some(p => permissions.includes(p))
          if (!hasRead) return null
        }

        // Visibility condition
        if (!isFieldVisible(field.visibility, watchedValues)) return null

        // Resolve disabled / readOnly (supports function form)
        const isDisabled = typeof field.disabled === 'function'
          ? field.disabled(watchedValues)
          : (field.disabled ?? false)

        const isReadOnly = typeof field.readOnly === 'function'
          ? field.readOnly(watchedValues)
          : (field.readOnly ?? false)

        // Write permission check
        const hasWrite = !field.permissions?.write?.length ||
          field.permissions.write.some(p => permissions.includes(p))
        const effectiveReadOnly = isReadOnly || !hasWrite

        return (
          <div key={field.key} className={getGridClasses(field.span)}>
            <FieldRenderer
              field={field}
              form={form}
              disabled={isDisabled}
              readOnly={effectiveReadOnly}
              options={fieldOptions[field.key]}
            />
          </div>
        )
      })}
    </div>
  )
}
