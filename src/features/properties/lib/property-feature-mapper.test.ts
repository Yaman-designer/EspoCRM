import { describe, it, expect } from 'vitest'
import { mapPropertyFeatures } from './property-feature-mapper'
import { buildProperty } from '@/test/builders/property'

describe('mapPropertyFeatures', () => {
  it('returns zero groups for a listing with no qualifying fields (empty groups filtered out)', () => {
    const result = mapPropertyFeatures(buildProperty({}))
    expect(result).toEqual([])
  })

  it('only includes groups that end up with at least one feature', () => {
    const result = mapPropertyFeatures(buildProperty({ energyClass: 'A' }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('technology')
    expect(result[0].features).toEqual(['Energy Class A'])
  })

  it('places furnished/heating/frames/glass/storage under Interior', () => {
    const result = mapPropertyFeatures(buildProperty({ furnished: 'furnished', doubleGlass: true }))
    const interior = result.find(g => g.id === 'interior')
    expect(interior?.features).toContain('Fully Furnished')
    expect(interior?.features).toContain('Double-Glazed Windows')
  })

  it('resolves a mapped heating value to its label, falls back to a literal label for unmapped values', () => {
    const mapped = mapPropertyFeatures(buildProperty({ cHeatingMedium: 'heatpump' }))
    expect(mapped.find(g => g.id === 'interior')?.features).toContain('Heat Pump Climate Control')

    const unmapped = mapPropertyFeatures(buildProperty({ cHeatingMedium: 'thermopompos' }))
    expect(unmapped.find(g => g.id === 'interior')?.features).toContain('thermopompos Heating System')
  })

  it('excludes "No access" from Exterior access, includes other real values', () => {
    const noAccess = mapPropertyFeatures(buildProperty({ accessFrom: 'No access' }))
    expect(noAccess.find(g => g.id === 'exterior')).toBeUndefined()

    const sea = mapPropertyFeatures(buildProperty({ accessFrom: 'Sea' }))
    expect(sea.find(g => g.id === 'exterior')?.features).toContain('Sea-Access Property')
  })

  it('places door under Security, elevator under Community', () => {
    const result = mapPropertyFeatures(buildProperty({ door: 'Security', buildingElevator: true }))
    expect(result.find(g => g.id === 'security')?.features).toContain('Security Entry Door')
    expect(result.find(g => g.id === 'community')?.features).toContain('Building Elevator')
  })

  it('resolveFeature: boolean true/false map to ifYes/absent (balcony), "No"/"False" strings are absent (garage)', () => {
    const boolTrue = mapPropertyFeatures(buildProperty({ balcony: true }))
    expect(boolTrue.find(g => g.id === 'exterior')?.features).toContain('Private Balcony')

    const boolFalse = mapPropertyFeatures(buildProperty({ balcony: false }))
    expect(boolFalse.find(g => g.id === 'exterior')).toBeUndefined()

    const stringNo = mapPropertyFeatures(buildProperty({ garage: 'No' }))
    expect(stringNo.find(g => g.id === 'exterior')).toBeUndefined()

    const stringValue = mapPropertyFeatures(buildProperty({ garage: 'Double' }))
    expect(stringValue.find(g => g.id === 'exterior')?.features).toContain('Double Garage')
  })

  it('groups are always returned in the fixed Interior/Exterior/Security/Technology/Community order', () => {
    const result = mapPropertyFeatures(buildProperty({
      furnished: 'furnished', balcony: true, door: 'Security', energyClass: 'A', buildingElevator: true,
    }))
    expect(result.map(g => g.id)).toEqual(['interior', 'exterior', 'security', 'technology', 'community'])
  })
})
