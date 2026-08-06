import { describe, it, expect } from 'vitest'
import {
  countNearbyByCategory, resolveActiveTab, filterNearbyByCategories, resolveMapCoords,
  buildAddressCoordinatesViewModel,
} from './location.viewmodel'
import { buildProperty } from '@/test/builders/property'
import type { NearbyPlace } from '../hooks/usePropertyLocation'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4.

function place(category: NearbyPlace['category'], overrides: Partial<NearbyPlace> = {}): NearbyPlace {
  return { id: `${category}-1`, name: 'Place', category, distance: 0.5, lat: 0, lon: 0, ...overrides }
}

describe('countNearbyByCategory — null/edge cases (Rule 3)', () => {
  it('empty array: every real category present with count 0, not missing keys', () => {
    const counts = countNearbyByCategory([])
    expect(counts).toEqual({ school: 0, hospital: 0, metro: 0, restaurant: 0, shopping: 0 })
  })

  it('mixed categories: counts each independently, unaffected by the others', () => {
    const counts = countNearbyByCategory([place('school'), place('school'), place('metro')])
    expect(counts.school).toBe(2)
    expect(counts.metro).toBe(1)
    expect(counts.hospital).toBe(0)
  })
})

describe('resolveActiveTab — conditional branch matrix (Rule 4)', () => {
  it('null selection: falls back to the first available tab', () => {
    expect(resolveActiveTab(['education', 'medical'], null)).toBe('education')
  })
  it('selection still in the available list: kept as-is', () => {
    expect(resolveActiveTab(['education', 'medical'], 'medical')).toBe('medical')
  })
  it('selection no longer in the available list (its category dropped to 0): falls back to first available', () => {
    expect(resolveActiveTab(['medical'], 'education')).toBe('medical')
  })
  it('no tabs available at all: returns null, not undefined or a crash', () => {
    expect(resolveActiveTab([], 'education')).toBeNull()
    expect(resolveActiveTab([], null)).toBeNull()
  })
})

describe('resolveMapCoords — null/edge cases + conditional matrix (Rules 3 & 4)', () => {
  it('real stored coordinates present: used directly, isApproximate=false, geocoded result ignored even if also present', () => {
    const coords = resolveMapCoords(
      { addressLatitude: 10, addressLongitude: 20 },
      { latitude: 99, longitude: 99 },
    )
    expect(coords).toEqual({ latitude: 10, longitude: 20, isApproximate: false })
  })

  it('no real coordinates, geocoded result present: used as fallback, isApproximate=true', () => {
    const coords = resolveMapCoords(
      { addressLatitude: undefined, addressLongitude: undefined },
      { latitude: 30, longitude: 40 },
    )
    expect(coords).toEqual({ latitude: 30, longitude: 40, isApproximate: true })
  })

  it('neither real coordinates nor a geocoded result: null, not a crash or fabricated 0,0', () => {
    expect(resolveMapCoords({ addressLatitude: undefined, addressLongitude: undefined }, null)).toBeNull()
    expect(resolveMapCoords({ addressLatitude: undefined, addressLongitude: undefined }, undefined)).toBeNull()
  })

  it('only ONE of latitude/longitude set (invalid partial coordinate): treated as absent, not a crash on the missing half', () => {
    const coords = resolveMapCoords({ addressLatitude: 10, addressLongitude: undefined }, { latitude: 30, longitude: 40 })
    // Falls through to the geocoded fallback rather than using a half-formed real coordinate.
    expect(coords).toEqual({ latitude: 30, longitude: 40, isApproximate: true })
  })

  it('coordinates are exactly 0,0 (a real, valid equatorial/prime-meridian value, not "empty")', () => {
    const coords = resolveMapCoords({ addressLatitude: 0, addressLongitude: 0 }, null)
    // 0 is a legitimate coordinate — `!= null` (not falsy-check) must treat it as present.
    expect(coords).toEqual({ latitude: 0, longitude: 0, isApproximate: false })
  })
})

describe('filterNearbyByCategories — conditional matrix (Rule 4)', () => {
  it('filters to only the requested categories, excludes everything else', () => {
    const nearby = [place('school'), place('metro'), place('restaurant')]
    expect(filterNearbyByCategories(nearby, ['school'])).toEqual([nearby[0]])
    expect(filterNearbyByCategories(nearby, ['restaurant', 'shopping'])).toEqual([nearby[2]])
  })
  it('empty category list: filters everything out', () => {
    expect(filterNearbyByCategories([place('school')], [])).toEqual([])
  })
})

describe('buildAddressCoordinatesViewModel — full null/edge + conditional matrix (Rules 3 & 4)', () => {
  it('completely empty property: isEmpty=true, every field safely null/empty, no crash', () => {
    const vm = buildAddressCoordinatesViewModel(buildProperty({}))
    expect(vm.isEmpty).toBe(true)
    expect(vm.addressLine).toBeNull()
    expect(vm.hasCoords).toBe(false)
    expect(vm.distances).toEqual([])
    expect(vm.facts).toEqual([])
  })

  it('address fragments that are meaningless (empty string, single character) are excluded from addressLine', () => {
    const vm = buildAddressCoordinatesViewModel(buildProperty({
      addressStreet: '', addressCity: 'x', addressState: undefined, addressPostalCode: 'Athens',
    }))
    // A single stray character is exactly the "garbage fragment" filter this function documents.
    expect(vm.addressLine).not.toContain('x')
    expect(vm.addressLine).toContain('Athens')
  })

  it('distances: each of the 4 fields is independently optional — proven with only 1 of 4 set', () => {
    const vm = buildAddressCoordinatesViewModel(buildProperty({ distanceFromCity: 12 }))
    expect(vm.distances).toEqual([{ labelKey: 'location.addressCoordinates.distanceRows.fromCity', value: 12 }])
  })

  it('distances: value of 0 (a real "right next to it" distance) is not filtered out as falsy', () => {
    const vm = buildAddressCoordinatesViewModel(buildProperty({ distanceFromSea: 0 }))
    expect(vm.distances).toContainEqual({ labelKey: 'location.addressCoordinates.distanceRows.fromSea', value: 0 })
  })

  it('withinCityPlan: true/false/undefined render as three genuinely distinct states — false is a fact, not an absence', () => {
    const trueVm = buildAddressCoordinatesViewModel(buildProperty({ withinCityPlan: true }))
    const falseVm = buildAddressCoordinatesViewModel(buildProperty({ withinCityPlan: false }))
    const unsetVm = buildAddressCoordinatesViewModel(buildProperty({ withinCityPlan: undefined }))
    expect(trueVm.facts).toContainEqual({ labelKey: 'location.addressCoordinates.factRows.withinCityPlan', value: 'Yes' })
    expect(falseVm.facts).toContainEqual({ labelKey: 'location.addressCoordinates.factRows.withinCityPlan', value: 'No' })
    expect(unsetVm.facts.find(f => f.labelKey === 'location.addressCoordinates.factRows.withinCityPlan')).toBeUndefined()
  })

  it('isEmpty is false if ANY one of address/coords/distances/facts has real data — proven independently for each', () => {
    expect(buildAddressCoordinatesViewModel(buildProperty({ addressCity: 'Athens' })).isEmpty).toBe(false)
    expect(buildAddressCoordinatesViewModel(buildProperty({ addressLatitude: 1, addressLongitude: 1 })).isEmpty).toBe(false)
    expect(buildAddressCoordinatesViewModel(buildProperty({ distanceFromSea: 5 })).isEmpty).toBe(false)
    expect(buildAddressCoordinatesViewModel(buildProperty({ belt: 'residential' })).isEmpty).toBe(false)
  })
})
