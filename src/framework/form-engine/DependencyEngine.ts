import type { FieldSchema, StepSchema, FieldOption } from './types'
import { evaluateCondition } from './VisibilityEngine'
import { getAllFields } from './utils'

export interface DependencyChange {
  fieldKey: string
  action: 'clear' | 'reload-options'
  loader?: (parentValue: unknown) => Promise<FieldOption[]>
}

/**
 * Compares previous and current form values and returns an array of
 * dependency actions that should be executed.
 *
 * Called reactively in DynamicForm whenever watchedValues changes.
 */
export function computeDependencyChanges(
  schema: StepSchema,
  prevValues: Record<string, unknown>,
  currValues: Record<string, unknown>,
): DependencyChange[] {
  const fields = getAllFields(schema) as FieldSchema[]
  const changes: DependencyChange[] = []

  for (const field of fields) {
    if (!field.dependencies?.length) continue

    for (const dep of field.dependencies) {
      const prev = prevValues[dep.on]
      const curr = currValues[dep.on]

      if (prev === curr) continue

      // Optional guard condition
      if (dep.when && !evaluateCondition(dep.when, currValues)) continue

      if (dep.action === 'clear') {
        changes.push({ fieldKey: field.key, action: 'clear' })
      } else if (dep.action === 'reload-options' && dep.loadOptions) {
        const loader = dep.loadOptions
        changes.push({
          fieldKey: field.key,
          action: 'reload-options',
          loader: (parentValue: unknown) => loader(String(parentValue ?? ''), currValues),
        })
      }
    }
  }

  return changes
}
