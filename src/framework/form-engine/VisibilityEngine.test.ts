import { describe, it, expect } from 'vitest'
import { evaluateCondition, isFieldVisible } from './VisibilityEngine'
import type { ConditionNode } from './types'
import { NOT_LAND_CATEGORY, RESIDENTIAL_CATEGORY, FURNISHED_HAS_VALUE } from '@/features/properties/domain/visibility'

describe('VisibilityEngine', () => {
  describe('evaluateCondition — leaf operators', () => {
    const cases: [ConditionNode, Record<string, unknown>, boolean][] = [
      [{ field: 'category', operator: 'eq', value: 'Land' }, { category: 'Land' }, true],
      [{ field: 'category', operator: 'eq', value: 'Land' }, { category: 'Residential' }, false],
      [{ field: 'category', operator: 'neq', value: 'Land' }, { category: 'Residential' }, true],
      [{ field: 'square', operator: 'gt', value: 100 }, { square: 150 }, true],
      [{ field: 'square', operator: 'gt', value: 100 }, { square: 50 }, false],
      [{ field: 'square', operator: 'gte', value: 100 }, { square: 100 }, true],
      [{ field: 'square', operator: 'lt', value: 100 }, { square: 50 }, true],
      [{ field: 'square', operator: 'lte', value: 100 }, { square: 100 }, true],
      [{ field: 'title', operator: 'contains', value: 'Villa' }, { title: 'Luxury Villa' }, true],
      [{ field: 'title', operator: 'not_contains', value: 'Villa' }, { title: 'Apartment' }, true],
      [{ field: 'propertyCode', operator: 'starts_with', value: 'DVL' }, { propertyCode: 'DVL68660' }, true],
      [{ field: 'propertyCode', operator: 'ends_with', value: '60' }, { propertyCode: 'DVL68660' }, true],
      [{ field: 'description', operator: 'empty', value: undefined }, { description: '' }, true],
      [{ field: 'description', operator: 'empty', value: undefined }, { description: null }, true],
      [{ field: 'features', operator: 'empty', value: undefined }, { features: [] }, true],
      [{ field: 'description', operator: 'not_empty', value: undefined }, { description: 'x' }, true],
      [{ field: 'category', operator: 'in', value: ['Land', 'Other'] }, { category: 'Land' }, true],
      [{ field: 'category', operator: 'not_in', value: ['Land', 'Other'] }, { category: 'Residential' }, true],
      // Unknown operator defaults to visible (fail-open, matches VisibilityEngine.ts's default: true).
      [{ field: 'x', operator: 'bogus' as never, value: undefined }, {}, true],
    ]

    it.each(cases)('%o against %o → %s', (node, values, expected) => {
      expect(evaluateCondition(node, values)).toBe(expected)
    })
  })

  describe('evaluateCondition — groups', () => {
    it('AND (default logic): every condition must pass', () => {
      const group: ConditionNode = {
        conditions: [
          { field: 'category', operator: 'neq', value: 'Land' },
          { field: 'category', operator: 'neq', value: 'Other' },
        ],
      }
      expect(evaluateCondition(group, { category: 'Residential' })).toBe(true)
      expect(evaluateCondition(group, { category: 'Land' })).toBe(false)
    })

    it('OR logic: any condition passing is enough', () => {
      const group: ConditionNode = {
        logic: 'or',
        conditions: [
          { field: 'category', operator: 'eq', value: 'Land' },
          { field: 'category', operator: 'eq', value: 'Other' },
        ],
      }
      expect(evaluateCondition(group, { category: 'Other' })).toBe(true)
      expect(evaluateCondition(group, { category: 'Residential' })).toBe(false)
    })

    it('supports nested groups', () => {
      const nested: ConditionNode = {
        logic: 'or',
        conditions: [
          { field: 'category', operator: 'eq', value: 'Land' },
          {
            conditions: [
              { field: 'itNeedsRenovation', operator: 'eq', value: false },
              { field: 'category', operator: 'neq', value: 'Land' },
            ],
          },
        ],
      }
      expect(evaluateCondition(nested, { category: 'Residential', itNeedsRenovation: false })).toBe(true)
      expect(evaluateCondition(nested, { category: 'Residential', itNeedsRenovation: true })).toBe(false)
      expect(evaluateCondition(nested, { category: 'Land', itNeedsRenovation: true })).toBe(true)
    })
  })

  describe('isFieldVisible', () => {
    it('is always visible when there is no visibility rule', () => {
      expect(isFieldVisible(undefined, {})).toBe(true)
    })

    it('delegates to evaluateCondition when a rule exists', () => {
      expect(isFieldVisible(NOT_LAND_CATEGORY, { category: 'Land' })).toBe(false)
      expect(isFieldVisible(NOT_LAND_CATEGORY, { category: 'Residential' })).toBe(true)
    })
  })

  // Real, currently-shipping RealEstateProperty rules (domain/visibility.ts) —
  // exercised through the actual engine, not re-implemented in the test.
  describe('real domain rules from features/properties/domain/visibility.ts', () => {
    it('RESIDENTIAL_CATEGORY matches only category === "Residential"', () => {
      expect(isFieldVisible(RESIDENTIAL_CATEGORY, { category: 'Residential' })).toBe(true)
      expect(isFieldVisible(RESIDENTIAL_CATEGORY, { category: 'Commercial' })).toBe(false)
    })

    it('FURNISHED_HAS_VALUE matches the live lowercase enum, not the stale "No" casing', () => {
      expect(isFieldVisible(FURNISHED_HAS_VALUE, { furnished: 'furnished' })).toBe(true)
      expect(isFieldVisible(FURNISHED_HAS_VALUE, { furnished: 'no' })).toBe(false)
      expect(isFieldVisible(FURNISHED_HAS_VALUE, { furnished: '' })).toBe(false)
      expect(isFieldVisible(FURNISHED_HAS_VALUE, { furnished: undefined })).toBe(false)
    })
  })
})
