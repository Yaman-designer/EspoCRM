import { describe, it, expect } from 'vitest'
import { buildSpecsViewModel } from './specs.viewmodel'
import { buildProperty } from '@/test/builders/property'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4.

describe('buildSpecsViewModel — null/edge cases (Rule 3)', () => {
  it('nothing set: isEmpty=true, empty items, empty groups, no crash', () => {
    const vm = buildSpecsViewModel(buildProperty({}))
    expect(vm.isEmpty).toBe(true)
    expect(vm.items).toEqual([])
    expect(vm.fullSpecGroups).toEqual([])
  })

  it('floor/floorCount: both null produces no Floor tile at all (not a "Floor null of null")', () => {
    const vm = buildSpecsViewModel(buildProperty({ floor: undefined, floorCount: undefined }))
    expect(vm.items.find(i => i.key === 'floor')).toBeUndefined()
  })

  it('bedroomCount/bathroomCount/square of exactly 0 (a real, valid value for a studio/plot) are not filtered out as falsy', () => {
    const vm = buildSpecsViewModel(buildProperty({ bedroomCount: 0, bathroomCount: 0, square: 0 }))
    // != null check, not truthy check — 0 must produce real tiles.
    expect(vm.items.find(i => i.key === 'bedrooms')?.value).toBe('0 Bedrooms')
    expect(vm.items.find(i => i.key === 'area')?.value).toContain('0')
  })
})

describe('buildSpecsViewModel — Floor combination conditional matrix (Rule 4)', () => {
  it('floor only, no floorCount: "Floor N"', () => {
    const vm = buildSpecsViewModel(buildProperty({ floor: 3, floorCount: undefined }))
    expect(vm.items.find(i => i.key === 'floor')!.value).toBe('Floor 3')
  })
  it('floorCount only, no floor: "N Floors"', () => {
    const vm = buildSpecsViewModel(buildProperty({ floor: undefined, floorCount: 5 }))
    expect(vm.items.find(i => i.key === 'floor')!.value).toBe('5 Floors')
  })
  it('both set: combined "Floor X of Y"', () => {
    const vm = buildSpecsViewModel(buildProperty({ floor: 3, floorCount: 12 }))
    expect(vm.items.find(i => i.key === 'floor')!.value).toBe('Floor 3 of 12')
  })

  it('energyClass tile is the only one with emphasize=true, every other tile has it unset', () => {
    const vm = buildSpecsViewModel(buildProperty({ energyClass: 'A+', bedroomCount: 2 }))
    expect(vm.items.find(i => i.key === 'energyClass')!.emphasize).toBe(true)
    expect(vm.items.find(i => i.key === 'bedrooms')!.emphasize).toBeUndefined()
  })

  it('Full Specifications modal groups: only groups with ≥1 populated row appear — proven with just 1 of 4 groups populated', () => {
    const vm = buildSpecsViewModel(buildProperty({ parkingSpaces: 2 }))
    expect(vm.fullSpecGroups.map(g => g.headingKey)).toEqual(['specs.groups.parking'])
  })

  it('all 4 Full Specifications groups populated: all 4 appear, in Dimensions/Rooms/Building & Construction/Parking order', () => {
    const vm = buildSpecsViewModel(buildProperty({
      plotArea: 100, livingRooms: 1, floorKey: '2', parkingSpaces: 1,
    }))
    expect(vm.fullSpecGroups.map(g => g.headingKey)).toEqual([
      'specs.groups.dimensions', 'specs.groups.rooms', 'specs.groups.buildingConstruction', 'specs.groups.parking',
    ])
  })

  it('lastFloor/penthouse: false renders "No" (unlike the boolean-suppression rule elsewhere — these are informational Yes/No facts, not noise badges)', () => {
    const vm = buildSpecsViewModel(buildProperty({ lastFloor: false, penthouse: false }))
    const group = vm.fullSpecGroups.find(g => g.headingKey === 'specs.groups.buildingConstruction')!
    expect(group.rows).toContainEqual({ labelKey: 'specs.rows.lastFloor', value: 'No' })
    expect(group.rows).toContainEqual({ labelKey: 'specs.rows.penthouse', value: 'No' })
  })

  it('lastFloor/penthouse: null/undefined (never set) produces no row at all — distinct from an explicit false', () => {
    const vm = buildSpecsViewModel(buildProperty({ lastFloor: undefined, penthouse: undefined, plotArea: 1 }))
    const group = vm.fullSpecGroups.find(g => g.headingKey === 'specs.groups.buildingConstruction')
    expect(group).toBeUndefined()
  })
})
