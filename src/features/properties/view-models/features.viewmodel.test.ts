import { describe, it, expect } from 'vitest'
import { buildFeaturesViewModel } from './features.viewmodel'
import { buildProperty } from '@/test/builders/property'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3, 4, 5 (Enum).

describe('buildFeaturesViewModel — null/edge cases (Rule 3)', () => {
  it('nothing set: isEmpty=true, every group empty, no crash', () => {
    const vm = buildFeaturesViewModel(buildProperty({}))
    expect(vm.isEmpty).toBe(true)
    expect(vm.amenityBadges).toEqual([])
    expect(vm.outdoorRows).toEqual([])
  })

  it('garage="No": explicitly excluded, not shown as a badge (distinct from garage="Yes"/a descriptive size string)', () => {
    const vm = buildFeaturesViewModel(buildProperty({ garage: 'No' }))
    expect(vm.amenityBadges.find(b => b.key === 'garage')).toBeUndefined()
  })

  it('swimmingPool="No": excluded from Outdoor Features, same rule as garage', () => {
    const vm = buildFeaturesViewModel(buildProperty({ swimmingPool: 'No' }))
    expect(vm.outdoorRows.find(r => r.key === 'swimming-pool')).toBeUndefined()
  })

  it('cOrientation unmapped/unknown code: falls back to the raw code itself, not blank or "undefined"', () => {
    const vm = buildFeaturesViewModel(buildProperty({ cOrientation: 'not-a-real-code' }))
    expect(vm.orientationLabel).toBe('not-a-real-code')
  })
})

describe('buildFeaturesViewModel — conditional branch matrix (Rule 4)', () => {
  it('garage="Yes": bare "garage" key, no type param', () => {
    const vm = buildFeaturesViewModel(buildProperty({ garage: 'Yes' }))
    const badge = vm.amenityBadges.find(b => b.key === 'garage')!
    expect(badge.labelKey).toBe('features.garage')
    expect(badge.labelParams).toBeUndefined()
  })
  it('garage="Double" (a descriptive size, not Yes/No): "garageWithType" key with the real type as a param', () => {
    const vm = buildFeaturesViewModel(buildProperty({ garage: 'Double' }))
    const badge = vm.amenityBadges.find(b => b.key === 'garage')!
    expect(badge.labelKey).toBe('features.garageWithType')
    expect(badge.labelParams).toEqual({ type: 'Double' })
  })

  it('all 3 elevator booleans independently gate their own badge — proven with only 1 of 3 true', () => {
    const vm = buildFeaturesViewModel(buildProperty({ buildingElevator: true, buildingElevatorRooms: false, internalElevator: false }))
    expect(vm.amenityBadges.map(b => b.key)).toEqual(['building-elevator'])
  })

  it('features array energy split: solarWaterHeating/nightPower route to energyBadges, everything else routes to lifestyleChips — no value in both', () => {
    const vm = buildFeaturesViewModel(buildProperty({ features: ['solarWaterHeating', 'nightPower', 'Garden', 'Alarm'] }))
    expect(vm.energyBadges).toHaveLength(2)
    expect(vm.lifestyleChips).toEqual(['Garden', 'Alarm'])
    expect(vm.lifestyleChips).not.toContain('solarWaterHeating')
  })

  it('lifestyleChips also includes additionalBenefits, appended after the features-derived chips', () => {
    const vm = buildFeaturesViewModel(buildProperty({ features: ['Garden'], additionalBenefits: ['BBQ'] }))
    expect(vm.lifestyleChips).toEqual(['Garden', 'BBQ'])
  })

  it('hasPrimaryRow: true if ANY of orientation/amenities/accessibility/energy has data, false only if all 4 are empty', () => {
    expect(buildFeaturesViewModel(buildProperty({})).hasPrimaryRow).toBe(false)
    expect(buildFeaturesViewModel(buildProperty({ hasDisabledAccess: true })).hasPrimaryRow).toBe(true)
  })

  it('hasSecondaryRow: true if ANY of placement/suitability/outdoor has data', () => {
    expect(buildFeaturesViewModel(buildProperty({})).hasSecondaryRow).toBe(false)
    expect(buildFeaturesViewModel(buildProperty({ idealForStudents: true })).hasSecondaryRow).toBe(true)
  })
})

describe('buildFeaturesViewModel — enum label mapping (Rule 5)', () => {
  it('a real orientation code maps to its real Greek/English label, not the raw code', () => {
    const vm = buildFeaturesViewModel(buildProperty({ cOrientation: 'n' }))
    expect(vm.orientationLabel).not.toBe('n')
  })

  it('cPlacement values map through PLACEMENT_LABELS, unmapped values fall back to the raw value', () => {
    const vm = buildFeaturesViewModel(buildProperty({ cPlacement: ['airy', 'not-a-real-value'] }))
    expect(vm.placementChips).toContain('not-a-real-value')
    expect(vm.placementChips).not.toContain('airy') // 'airy' maps to its real Greek label, not itself
  })
})
