'use client'

import { useContext, useRef, useEffect } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { DynamicFormContext } from './context'
import { computeDependencyChanges } from './DependencyEngine'
import type { StepSchema, FieldOption } from './types'

/**
 * Access the DynamicForm context from inside a field component.
 * Provides permissions, dynamic field options, and option setters.
 */
export function useDynamicFormContext() {
  const ctx = useContext(DynamicFormContext)
  if (!ctx) throw new Error('useDynamicFormContext must be used inside <DynamicForm />')
  return ctx
}

/**
 * Internal hook — attaches the dependency engine to the live form.
 * Watches all form values, diffs against previous snapshot, executes dependency actions.
 */
export function useDependencyEngine(
  schema: StepSchema,
  form: UseFormReturn<any>,
  setFieldOptions: (key: string, options: FieldOption[]) => void,
) {
  const watchedValues = useWatch({ control: form.control }) as Record<string, unknown>
  const prevRef = useRef<Record<string, unknown>>({})

  useEffect(() => {
    const changes = computeDependencyChanges(schema, prevRef.current, watchedValues)

    for (const change of changes) {
      if (change.action === 'clear') {
        form.setValue(change.fieldKey, undefined, { shouldDirty: true })
      } else if (change.action === 'reload-options' && change.loader) {
        const parentVal = watchedValues[
          // Find the `on` field key that triggered this reload
          (schema.sections ?? []).flatMap(s => s.fields)
            .concat(schema.fields ?? [])
            .find(f => f.key === change.fieldKey)
            ?.dependencies?.find(d => d.action === 'reload-options')?.on ?? ''
        ]
        change.loader(parentVal).then(opts => setFieldOptions(change.fieldKey, opts))
      }
    }

    prevRef.current = { ...watchedValues }
  }, [watchedValues]) // eslint-disable-line react-hooks/exhaustive-deps
}
