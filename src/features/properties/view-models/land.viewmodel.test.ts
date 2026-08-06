import { describe, it, expect } from 'vitest'
import { buildLandViewModel } from './land.viewmodel'
import { buildProperty } from '@/test/builders/property'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4. Protects
// the earlier Enterprise Product Review fix: false boolean flags must never
// render as "No" noise — only true flags produce a label.
//
// Enterprise Localization pass (2026-07-24): `flagLabels`/row `label`
// (literal display text) became `flagKeys`/`labelKey` (i18next lookup
// keys) — see Row's own note in shared/detail-view/rows.ts.

describe('buildLandViewModel — category conditional matrix (Rule 4)', () => {
  it('category=Land: visible, even with zero populated fields', () => {
    const vm = buildLandViewModel(buildProperty({ category: 'Land' }))
    expect(vm.isVisible).toBe(true)
    expect(vm.isEmpty).toBe(true)
  })

  for (const category of ['Residential', 'Commercial', 'Other', undefined]) {
    it(`category=${category}: never visible, regardless of populated fields`, () => {
      const vm = buildLandViewModel(buildProperty({
        category, cBuildingBlocks: 5, cCityplan: true, cSlope: 'plane',
      }))
      expect(vm.isVisible).toBe(false)
      expect(vm.isEmpty).toBe(true)
      expect(vm.numberRows).toEqual([])
      expect(vm.flagKeys).toEqual([])
    })
  }
})

describe('buildLandViewModel — boolean-suppression regression protection (Rule 3/9)', () => {
  it('false boolean flags produce NO key — the exact "No/No/No" noise bug this ViewModel exists to prevent', () => {
    const vm = buildLandViewModel(buildProperty({
      category: 'Land',
      cCityplan: false, cResidentialArea: false, cFacade: false,
      cBuildingPermit: false, cAgriculturalUse: false, cContainsBuilding: false,
    }))
    expect(vm.flagKeys).toEqual([])
  })

  it('true boolean flags each produce exactly their own key, no others', () => {
    const vm = buildLandViewModel(buildProperty({
      category: 'Land', cBuildingPermit: true,
    }))
    expect(vm.flagKeys).toEqual(['land.flags.buildingPermit'])
  })

  it('null/undefined flags (never set) also produce no key — same as false, not an error state', () => {
    const vm = buildLandViewModel(buildProperty({ category: 'Land', cCityplan: undefined }))
    expect(vm.flagKeys).toEqual([])
  })

  it('all 6 flags true simultaneously: all 6 keys present', () => {
    const vm = buildLandViewModel(buildProperty({
      category: 'Land',
      cCityplan: true, cResidentialArea: true, cFacade: true,
      cBuildingPermit: true, cAgriculturalUse: true, cContainsBuilding: true,
    }))
    expect(vm.flagKeys).toHaveLength(6)
  })

  it('number fields: each of the 7 is independently optional, proven with only 1 of 7 set', () => {
    const vm = buildLandViewModel(buildProperty({ category: 'Land', cFrontLength: 12 }))
    expect(vm.numberRows).toEqual([{ labelKey: 'land.rows.frontLength', value: '12' }])
  })

  it('number field value of 0 is not filtered out as falsy', () => {
    const vm = buildLandViewModel(buildProperty({ category: 'Land', cBuildingBlocks: 0 }))
    expect(vm.numberRows).toContainEqual({ labelKey: 'land.rows.buildingBlocks', value: '0' })
  })

  it('slopeValue: passes through the real value, null when unset', () => {
    expect(buildLandViewModel(buildProperty({ category: 'Land', cSlope: 'inclining' })).slopeValue).toBe('inclining')
    expect(buildLandViewModel(buildProperty({ category: 'Land', cSlope: undefined })).slopeValue).toBeNull()
  })
})
