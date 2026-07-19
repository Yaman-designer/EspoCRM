import { describe, it, expect } from 'vitest'
import { getAssignmentForCategory } from './assignment-rules'

describe('getAssignmentForCategory', () => {
  it.each(['Residential', 'Commercial', 'Land', 'Other'] as const)(
    'resolves %s to "Simple" (every category currently resolves the same, confirmed live 2026-07-11)',
    (category) => {
      expect(getAssignmentForCategory(category)).toBe('Simple')
    },
  )

  it('returns undefined for an empty/unrecognized category — rule does not apply yet', () => {
    expect(getAssignmentForCategory(undefined)).toBeUndefined()
    expect(getAssignmentForCategory(null)).toBeUndefined()
    expect(getAssignmentForCategory('')).toBeUndefined()
    expect(getAssignmentForCategory('NotARealCategory')).toBeUndefined()
  })
})
