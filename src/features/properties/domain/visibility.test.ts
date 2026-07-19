import { describe, it, expect } from 'vitest'
import {
  NOT_LAND_CATEGORY, LAND_CATEGORY, NOT_LAND_OR_OTHER_CATEGORY,
  NOT_NEEDS_RENOVATION_AND_NOT_LAND, RENOVATED_TRUE, INVESTMENT_TRUE,
  WITHIN_MONTHLY_UTILITIES_TRUE, CBANNER_TRUE,
  CCONSIDERATION_TRUE, RESIDENTIAL_CATEGORY, FURNISHED_HAS_VALUE,
} from './visibility'

// These are declarative ConditionNode data objects consumed directly by the
// form-engine's VisibilityEngine (see VisibilityEngine.test.ts for the
// engine's own evaluation-logic coverage) — these tests lock the *shape* of
// each shared condition so a future edit can't silently change which field/
// operator/value a Wizard step's visibility rule actually checks.

describe('single-condition nodes', () => {
  it('NOT_LAND_CATEGORY: category != Land', () => {
    expect(NOT_LAND_CATEGORY).toEqual({ field: 'category', operator: 'neq', value: 'Land' })
  })

  it('LAND_CATEGORY: category == Land (positive counterpart of NOT_LAND_CATEGORY)', () => {
    expect(LAND_CATEGORY).toEqual({ field: 'category', operator: 'eq', value: 'Land' })
  })

  it('RESIDENTIAL_CATEGORY: category == Residential', () => {
    expect(RESIDENTIAL_CATEGORY).toEqual({ field: 'category', operator: 'eq', value: 'Residential' })
  })

  it('RENOVATED_TRUE / INVESTMENT_TRUE / WITHIN_MONTHLY_UTILITIES_TRUE / CBANNER_TRUE / CCONSIDERATION_TRUE: each is a boolean-field==true gate on its own field', () => {
    expect(RENOVATED_TRUE).toEqual({ field: 'renovated', operator: 'eq', value: true })
    expect(INVESTMENT_TRUE).toEqual({ field: 'investment', operator: 'eq', value: true })
    expect(WITHIN_MONTHLY_UTILITIES_TRUE).toEqual({ field: 'withinMonthlyUtilities', operator: 'eq', value: true })
    expect(CBANNER_TRUE).toEqual({ field: 'cBanner', operator: 'eq', value: true })
    expect(CCONSIDERATION_TRUE).toEqual({ field: 'cConsideration', operator: 'eq', value: true })
  })
})

describe('compound condition nodes', () => {
  it('NOT_LAND_OR_OTHER_CATEGORY: category != Land AND category != Other', () => {
    expect(NOT_LAND_OR_OTHER_CATEGORY).toEqual({
      conditions: [
        { field: 'category', operator: 'neq', value: 'Land' },
        { field: 'category', operator: 'neq', value: 'Other' },
      ],
    })
  })

  it('NOT_NEEDS_RENOVATION_AND_NOT_LAND: itNeedsRenovation == false AND category != Land', () => {
    expect(NOT_NEEDS_RENOVATION_AND_NOT_LAND).toEqual({
      conditions: [
        { field: 'itNeedsRenovation', operator: 'eq', value: false },
        { field: 'category', operator: 'neq', value: 'Land' },
      ],
    })
  })

  it('FURNISHED_HAS_VALUE: furnished not_empty AND furnished != the real lowercase "no" (not the Dynamic Logic export\'s stale capital-N "No")', () => {
    expect(FURNISHED_HAS_VALUE).toEqual({
      conditions: [
        { field: 'furnished', operator: 'not_empty' },
        { field: 'furnished', operator: 'neq', value: 'no' },
      ],
    })
  })
})
