'use client'

import { useState, useCallback } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { SectionRenderer } from './SectionRenderer'
import { useDependencyEngine } from './useDynamicForm'
import { DynamicFormContext } from './context'
import type { StepSchema, DynamicFormContextValue, FieldOption } from './types'

export { DynamicFormContext }

/* ─── DynamicForm ────────────────────────────────────────────────── */

interface DynamicFormProps {
  schema: StepSchema
  form: UseFormReturn<any>
  /** User permission keys for field-level access control */
  permissions?: string[]
  className?: string
}

/**
 * Schema-driven form body renderer.
 *
 * Renders sections → fields via GridEngine → FieldRenderer.
 * Handles: field visibility, disabled/readOnly resolution, dependency cascades.
 *
 * Usage inside FormFramework:
 * ```tsx
 * <FormStep id="basics">
 *   <DynamicForm schema={basicSchema} form={form} />
 * </FormStep>
 * ```
 *
 * Or via the convenience wrapper:
 * ```tsx
 * <DynamicFormStep id="basics" schema={basicSchema} form={form} />
 * ```
 */
export function DynamicForm({ schema, form, permissions = [], className }: DynamicFormProps) {
  const [fieldOptions, setFieldOptionsState] = useState<Record<string, FieldOption[]>>({})

  const setFieldOptions = useCallback((key: string, options: FieldOption[]) => {
    setFieldOptionsState(prev => ({ ...prev, [key]: options }))
  }, [])

  const [fieldOptionsLoading, setFieldOptionsLoadingState] = useState<Record<string, boolean>>({})
  const setFieldOptionsLoading = useCallback((key: string, loading: boolean) => {
    setFieldOptionsLoadingState(prev => ({ ...prev, [key]: loading }))
  }, [])

  // Live form values for visibility / disabled evaluation
  const watchedValues = useWatch({ control: form.control }) as Record<string, unknown>

  // Dependency engine: watches values, executes clear / reload-options
  useDependencyEngine(schema, form, setFieldOptions, setFieldOptionsLoading)

  // Resolve sections: support both sections[] and fields[] shorthand
  const sections = schema.sections ?? [
    { id: '__default', fields: schema.fields ?? [] },
  ]

  const contextValue: DynamicFormContextValue = {
    permissions,
    fieldOptions,
    setFieldOptions,
    fieldOptionsLoading,
    setFieldOptionsLoading,
  }

  return (
    <DynamicFormContext.Provider value={contextValue}>
      <div className={cn('space-y-5 sm:space-y-6', className)}>
        {sections.map((section, sectionIndex) => (
          <SectionRenderer
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={permissions}
            hideHeader={!schema.sections && sections.length === 1 && !section.titleKey}
          />
        ))}
      </div>
    </DynamicFormContext.Provider>
  )
}
