import { describe, it, expect } from 'vitest'
import { buildConstructionViewModel } from './construction.viewmodel'
import { buildProperty } from '@/test/builders/property'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4. Protects
// the BOOLEAN STRATEGY this ViewModel documents: every boolean flag renders
// ONLY when true.

describe('buildConstructionViewModel — null/edge cases (Rule 3)', () => {
  it('minimal property, nothing set: isEmpty=true, every group empty, no crash', () => {
    const vm = buildConstructionViewModel(buildProperty({}))
    expect(vm.isEmpty).toBe(true)
    expect(vm.conditionBadges).toEqual([])
    expect(vm.climateRows).toEqual([])
    expect(vm.materialsRows).toEqual([])
    expect(vm.structuralRows).toEqual([])
  })

  it('boolean flags false (not absent): produce no badge — the exact regression this pass exists to prevent', () => {
    const vm = buildConstructionViewModel(buildProperty({
      itNeedsRenovation: false, renovated: false, cUnderConstriction: false, doubleGlass: false, hasElectricalDevices: false,
    }))
    expect(vm.conditionBadges).toEqual([])
    expect(vm.hasDoubleGlass).toBe(false)
    expect(vm.hasElectricalDevices).toBe(false)
  })

  it('string fields that are empty string (not undefined): treated as absent, no empty-label row', () => {
    const vm = buildConstructionViewModel(buildProperty({ frames: '', door: '' }))
    expect(vm.materialsRows).toEqual([])
  })
})

describe('buildConstructionViewModel — conditional branch matrix (Rule 4)', () => {
  it('renovated=true without yearOfRenovation: bare "renovated" key, no params', () => {
    const vm = buildConstructionViewModel(buildProperty({ renovated: true, yearOfRenovation: undefined }))
    const badge = vm.conditionBadges.find(b => b.key === 'renovated')!
    expect(badge.labelKey).toBe('construction.badges.renovated')
    expect(badge.labelParams).toBeUndefined()
  })

  it('renovated=true WITH yearOfRenovation: "renovatedInYear" key with the real year as a param', () => {
    const vm = buildConstructionViewModel(buildProperty({ renovated: true, yearOfRenovation: 2020 }))
    const badge = vm.conditionBadges.find(b => b.key === 'renovated')!
    expect(badge.labelKey).toBe('construction.badges.renovatedInYear')
    expect(badge.labelParams).toEqual({ year: 2020 })
  })

  it('itNeedsRenovation and renovated are mutually exclusive in the real data model — both true simultaneously still renders both badges (ViewModel does not enforce the exclusivity itself, the data does)', () => {
    // Confirms the ViewModel doesn't silently drop one if the caller violates the invariant —
    // it's a pure shaping function, not a validator.
    const vm = buildConstructionViewModel(buildProperty({ itNeedsRenovation: true, renovated: true }))
    expect(vm.conditionBadges).toHaveLength(2)
  })

  it('climate: only cHeatingMedium set, cHeatingController absent — exactly 1 row, hasClimate true', () => {
    const vm = buildConstructionViewModel(buildProperty({ cHeatingMedium: 'gas', cHeatingController: undefined }))
    expect(vm.climateRows).toHaveLength(1)
    expect(vm.hasClimate).toBe(true)
  })

  it('climate: neither field set but climateChips (cAdditionalheating) present — hasClimate still true via chips alone', () => {
    const vm = buildConstructionViewModel(buildProperty({ cAdditionalheating: ['fireplace'] }))
    expect(vm.climateRows).toEqual([])
    expect(vm.hasClimate).toBe(true)
  })

  it('hasSecondaryRow: true if EITHER materials OR structural has data, false only if both are empty', () => {
    expect(buildConstructionViewModel(buildProperty({})).hasSecondaryRow).toBe(false)
    expect(buildConstructionViewModel(buildProperty({ frames: 'wooden' })).hasSecondaryRow).toBe(true)
    expect(buildConstructionViewModel(buildProperty({ hasElectricalDevices: true })).hasSecondaryRow).toBe(true)
  })

  it('isEmpty is false if ANY of the 4 groups has real data, proven independently for each', () => {
    expect(buildConstructionViewModel(buildProperty({ itNeedsRenovation: true })).isEmpty).toBe(false)
    expect(buildConstructionViewModel(buildProperty({ cHeatingMedium: 'gas' })).isEmpty).toBe(false)
    expect(buildConstructionViewModel(buildProperty({ frames: 'wooden' })).isEmpty).toBe(false)
    expect(buildConstructionViewModel(buildProperty({ hasElectricalDevices: true })).isEmpty).toBe(false)
  })
})
