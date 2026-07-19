import { describe, it, expect } from 'vitest'
import {
  CATEGORY_OPTIONS, REQUEST_TYPE_OPTIONS, ASSIGNMENT_OPTIONS, GEOCODE_TYPE_OPTIONS,
  BELT_OPTIONS, FLOOR_KEY_OPTIONS, ENERGY_CLASS_OPTIONS, HEATING_MEDIUM_OPTIONS,
  HEATING_CONTROLLER_OPTIONS, FRAMES_OPTIONS, DOOR_OPTIONS, FLOOR_TYPE_OPTIONS,
  BEDROOMS_FLOOR_TYPE_OPTIONS, ORIENTATION_OPTIONS, PARKING_TYPE_OPTIONS,
  STORAGE_SPACE_OPTIONS, SWIMMING_POOL_OPTIONS, GARAGE_OPTIONS, ACCESS_FROM_OPTIONS,
  SLOPE_OPTIONS, FURNISHED_OPTIONS, FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS,
  VIEW_OPTIONS, CONDITION_OPTIONS,
} from './options'

const ALL_OPTION_LISTS: [string, { value: string; label: string }[]][] = [
  ['CATEGORY_OPTIONS', CATEGORY_OPTIONS],
  ['REQUEST_TYPE_OPTIONS', REQUEST_TYPE_OPTIONS],
  ['ASSIGNMENT_OPTIONS', ASSIGNMENT_OPTIONS],
  ['GEOCODE_TYPE_OPTIONS', GEOCODE_TYPE_OPTIONS],
  ['BELT_OPTIONS', BELT_OPTIONS],
  ['FLOOR_KEY_OPTIONS', FLOOR_KEY_OPTIONS],
  ['ENERGY_CLASS_OPTIONS', ENERGY_CLASS_OPTIONS],
  ['HEATING_MEDIUM_OPTIONS', HEATING_MEDIUM_OPTIONS],
  ['HEATING_CONTROLLER_OPTIONS', HEATING_CONTROLLER_OPTIONS],
  ['FRAMES_OPTIONS', FRAMES_OPTIONS],
  ['DOOR_OPTIONS', DOOR_OPTIONS],
  ['FLOOR_TYPE_OPTIONS', FLOOR_TYPE_OPTIONS],
  ['BEDROOMS_FLOOR_TYPE_OPTIONS', BEDROOMS_FLOOR_TYPE_OPTIONS],
  ['ORIENTATION_OPTIONS', ORIENTATION_OPTIONS],
  ['PARKING_TYPE_OPTIONS', PARKING_TYPE_OPTIONS],
  ['STORAGE_SPACE_OPTIONS', STORAGE_SPACE_OPTIONS],
  ['SWIMMING_POOL_OPTIONS', SWIMMING_POOL_OPTIONS],
  ['GARAGE_OPTIONS', GARAGE_OPTIONS],
  ['ACCESS_FROM_OPTIONS', ACCESS_FROM_OPTIONS],
  ['SLOPE_OPTIONS', SLOPE_OPTIONS],
  ['FURNISHED_OPTIONS', FURNISHED_OPTIONS],
  ['FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS', FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS],
  ['VIEW_OPTIONS', VIEW_OPTIONS],
  ['CONDITION_OPTIONS', CONDITION_OPTIONS],
]

describe('option lists — structural invariants', () => {
  it.each(ALL_OPTION_LISTS)('%s is a non-empty array of { value, label } string pairs with no duplicate values', (_name, list) => {
    expect(list.length).toBeGreaterThan(0)
    for (const opt of list) {
      expect(typeof opt.value).toBe('string')
      expect(typeof opt.label).toBe('string')
      expect(opt.value.length).toBeGreaterThan(0)
    }
    const values = list.map(o => o.value)
    expect(new Set(values).size).toBe(values.length)
  })
})

// Business-critical value locks — each of these carries an explicit
// "confirmed against live EspoCRM" comment in options.ts warning against
// casual modification. Exact-value assertions here are the regression net
// the file's own header comment calls for.
describe('option lists — live-value locks', () => {
  it('DOOR_OPTIONS uses lowercase yes/no values (Title Case labels) alongside Security/Simple', () => {
    expect(DOOR_OPTIONS).toEqual([
      { value: 'Security', label: 'Security' },
      { value: 'Simple', label: 'Simple' },
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ])
  })

  it('FURNISHED_OPTIONS has 6 genuinely distinct real enum values, not a merged 4', () => {
    expect(FURNISHED_OPTIONS.map(o => o.value)).toEqual([
      'furnished', 'no', 'halffurnished', 'fullyfurnished', 'half', 'full',
    ])
  })

  it('SLOPE_OPTIONS excludes EspoCRM\'s own blank placeholder option', () => {
    expect(SLOPE_OPTIONS.map(o => o.value)).toEqual(['plane', 'inclining', 'amphitheatric'])
  })

  it('VIEW_OPTIONS has exactly the 10 live enum values', () => {
    expect(VIEW_OPTIONS).toHaveLength(10)
    expect(VIEW_OPTIONS.map(o => o.value)).toEqual([
      'sea', 'mountain', 'town', 'park', 'open', 'field', 'forest', 'square', 'yes', 'no',
    ])
  })

  it('CATEGORY_OPTIONS has exactly the 4 real category values', () => {
    expect(CATEGORY_OPTIONS.map(o => o.value)).toEqual(['Residential', 'Commercial', 'Land', 'Other'])
  })
})
