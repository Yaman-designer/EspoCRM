import { describe, it, expect } from 'vitest'
import {
  resolvePropertyType, resolvePropertyTypes, isLandType, LAND_TYPE_VALUES, getTypeOptionsForCategory,
} from './property-type.registry'

describe('resolvePropertyType', () => {
  it('decorates a known value with its real label/category/icon', () => {
    const meta = resolvePropertyType('Apartment')
    expect(meta).toMatchObject({ value: 'Apartment', label: 'Apartment', category: 'residential' })
  })

  it('falls back to a generic residential-category decoration for an unknown value — never hides fields for an unrecognized type', () => {
    const meta = resolvePropertyType('SomeFutureType')
    expect(meta).toMatchObject({ value: 'SomeFutureType', label: 'SomeFutureType', category: 'residential' })
  })

  it('recognizes both the Title-Case legacy vocabulary and the lowercase PDF vocabulary for the same land concept', () => {
    expect(resolvePropertyType('Land').category).toBe('land')
    expect(resolvePropertyType('plot').category).toBe('land')
    expect(resolvePropertyType('parcel').category).toBe('land')
  })
})

describe('resolvePropertyTypes', () => {
  it('maps a list in order', () => {
    const result = resolvePropertyTypes(['Apartment', 'Office', 'Land'])
    expect(result.map(r => r.category)).toEqual(['residential', 'commercial', 'land'])
  })
})

describe('isLandType', () => {
  it('is true for every value LAND_TYPE_VALUES lists', () => {
    for (const value of LAND_TYPE_VALUES) {
      expect(isLandType(value)).toBe(true)
    }
  })

  it('is false for a non-land value, and for empty/undefined/null', () => {
    expect(isLandType('Apartment')).toBe(false)
    expect(isLandType('')).toBe(false)
    expect(isLandType(undefined)).toBe(false)
    expect(isLandType(null)).toBe(false)
  })
})

describe('getTypeOptionsForCategory', () => {
  it('returns an empty list for an empty/unrecognized category (Type must show no options until Category is chosen)', () => {
    expect(getTypeOptionsForCategory(undefined)).toEqual([])
    expect(getTypeOptionsForCategory(null)).toEqual([])
    expect(getTypeOptionsForCategory('NotACategory')).toEqual([])
  })

  it('returns the exact 7-value Other catalogue, with no bare "other" entry', () => {
    const options = getTypeOptionsForCategory('Other')
    expect(options).toHaveLength(7)
    expect(options.map(o => o.value)).not.toContain('other')
  })

  it('returns Land\'s 4-value catalogue', () => {
    const options = getTypeOptionsForCategory('Land')
    expect(options.map(o => o.value)).toEqual(['plot', 'parcel', 'island', 'other land'])
  })

  it('title-cases each option\'s label from its raw lowercase value', () => {
    const options = getTypeOptionsForCategory('Commercial')
    const office = options.find(o => o.value === 'office')
    expect(office?.label).toBe('Office')
    const businessBuilding = options.find(o => o.value === 'business building')
    expect(businessBuilding?.label).toBe('Business Building')
  })
})
