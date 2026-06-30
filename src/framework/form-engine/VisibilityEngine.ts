import type { ConditionNode, FieldCondition, ConditionGroup } from './types'
import { getNestedValue } from './utils'

function evaluateLeaf(cond: FieldCondition, values: Record<string, unknown>): boolean {
  const fv = getNestedValue(values, cond.field)
  const { operator: op, value: cv } = cond

  switch (op) {
    case 'eq':          return fv === cv
    case 'neq':         return fv !== cv
    case 'gt':          return Number(fv) > Number(cv)
    case 'gte':         return Number(fv) >= Number(cv)
    case 'lt':          return Number(fv) < Number(cv)
    case 'lte':         return Number(fv) <= Number(cv)
    case 'contains':    return String(fv ?? '').includes(String(cv))
    case 'not_contains':return !String(fv ?? '').includes(String(cv))
    case 'starts_with': return String(fv ?? '').startsWith(String(cv))
    case 'ends_with':   return String(fv ?? '').endsWith(String(cv))
    case 'empty':       return fv == null || fv === '' || (Array.isArray(fv) && fv.length === 0)
    case 'not_empty':   return fv != null && fv !== '' && !(Array.isArray(fv) && fv.length === 0)
    case 'in':          return Array.isArray(cv) && cv.includes(fv)
    case 'not_in':      return Array.isArray(cv) && !cv.includes(fv)
    default:            return true
  }
}

/**
 * Recursively evaluates a ConditionNode (single condition or AND/OR group)
 * against the current form values. Returns true if the field should be visible.
 */
export function evaluateCondition(
  node: ConditionNode,
  values: Record<string, unknown>,
): boolean {
  if ('conditions' in node) {
    const group = node as ConditionGroup
    const results = group.conditions.map(c => evaluateCondition(c, values))
    return group.logic === 'or' ? results.some(Boolean) : results.every(Boolean)
  }
  return evaluateLeaf(node as FieldCondition, values)
}

/**
 * Returns true if the field should be rendered based on its visibility rule.
 * Fields without a visibility rule are always visible.
 */
export function isFieldVisible(
  visibility: ConditionNode | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!visibility) return true
  return evaluateCondition(visibility, values)
}
