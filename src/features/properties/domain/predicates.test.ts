import { describe, it, expect } from 'vitest'
import { isLandCategory, requiresFloorKey, isFurnished } from './predicates'

describe('isLandCategory', () => {
  it('is true only for the exact string "Land"', () => {
    expect(isLandCategory('Land')).toBe(true)
    expect(isLandCategory('land')).toBe(false)
    expect(isLandCategory('Residential')).toBe(false)
    expect(isLandCategory(undefined)).toBe(false)
    expect(isLandCategory(null)).toBe(false)
  })
})

describe('requiresFloorKey', () => {
  it('is required for every category except Land', () => {
    expect(requiresFloorKey('Residential')).toBe(true)
    expect(requiresFloorKey('Commercial')).toBe(true)
    expect(requiresFloorKey('Other')).toBe(true)
    expect(requiresFloorKey('Land')).toBe(false)
  })
})

describe('isFurnished', () => {
  it('is true for any real furnished-in-some-capacity enum value', () => {
    expect(isFurnished('furnished')).toBe(true)
    expect(isFurnished('halffurnished')).toBe(true)
    expect(isFurnished('fullyfurnished')).toBe(true)
    expect(isFurnished('half')).toBe(true)
    expect(isFurnished('full')).toBe(true)
  })

  it('is false for the real "no" value, empty string, or non-string values', () => {
    expect(isFurnished('no')).toBe(false)
    expect(isFurnished('')).toBe(false)
    expect(isFurnished(undefined)).toBe(false)
    expect(isFurnished(null)).toBe(false)
    expect(isFurnished(true)).toBe(false)
  })
})
