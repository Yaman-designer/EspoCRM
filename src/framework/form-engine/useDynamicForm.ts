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

/** Finds the `on` field key of a field's dependency with the given action. */
function findDependencyOn(schema: StepSchema, fieldKey: string, action: string): string {
  return (schema.sections ?? []).flatMap(s => s.fields)
    .concat(schema.fields ?? [])
    .find(f => f.key === fieldKey)
    ?.dependencies?.find(d => d.action === action)?.on ?? ''
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === ''
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
  // Tracks the last value THIS engine auto-derived for each field, within
  // this mount — never seeded from edit-mode/draft-restore prefill, so a
  // pre-existing record value is always treated as "manual" and protected.
  // See the auto-derive branch below.
  const autoValueRef = useRef<Record<string, unknown>>({})

  useEffect(() => {
    const changes = computeDependencyChanges(schema, prevRef.current, watchedValues)

    for (const change of changes) {
      if (change.action === 'clear') {
        form.setValue(change.fieldKey, undefined, { shouldDirty: true })
      } else if (change.action === 'reload-options' && change.loader) {
        const parentVal = watchedValues[findDependencyOn(schema, change.fieldKey, 'reload-options')]
        change.loader(parentVal).then(opts => {
          setFieldOptions(change.fieldKey, opts)
          // Reload can fire from an external form.reset() (e.g. draft restore,
          // edit prefill) where the field's current value was set together
          // with its parent, not by the user changing the parent — only clear
          // it if it's actually absent from the freshly loaded option set.
          const currentValue = form.getValues(change.fieldKey)
          if (!isEmptyValue(currentValue) && !opts.some(o => o.value === currentValue)) {
            form.setValue(change.fieldKey, undefined, { shouldDirty: true })
          }
        })
      } else if (change.action === 'update-validation') {
        form.trigger(change.fieldKey)
      } else if (change.action === 'auto-derive' && change.deriver) {
        const parentVal = watchedValues[findDependencyOn(schema, change.fieldKey, 'auto-derive')]
        const derived = change.deriver(parentVal)
        if (derived === undefined) continue // rule can't determine a value yet

        const currentValue = form.getValues(change.fieldKey)
        // Overwrite only if the field is empty, or its current value is
        // exactly what THIS engine auto-set last time (i.e. still untouched
        // by the user since) — a manually chosen or pre-existing record
        // value is never clobbered.
        const wasAutoSet = currentValue === autoValueRef.current[change.fieldKey]
        if (isEmptyValue(currentValue) || wasAutoSet) {
          if (currentValue !== derived) {
            form.setValue(change.fieldKey, derived, { shouldDirty: true })
          }
          autoValueRef.current[change.fieldKey] = derived
        }
      }
    }

    prevRef.current = { ...watchedValues }
  }, [watchedValues]) // eslint-disable-line react-hooks/exhaustive-deps
}
