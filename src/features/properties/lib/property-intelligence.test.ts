import { describe, it, expect } from 'vitest'
import { buildPropertyIntelligence } from './property-intelligence'
import { buildProperty } from '@/test/builders/property'

describe('buildPropertyIntelligence', () => {
  it('returns all-empty arrays for a listing with no qualifying fields', () => {
    const result = buildPropertyIntelligence(buildProperty({}))
    expect(result.highlights).toEqual([])
    expect(result.lifestyleBenefits).toEqual([])
    expect(result.sellingPoints).toEqual([])
    expect(result.investmentSignals).toEqual([])
  })

  describe('highlights', () => {
    it('translates a known orientation code via ORIENTATION_HIGHLIGHTS, falls back to a literal label otherwise', () => {
      const known = buildPropertyIntelligence(buildProperty({ cOrientation: 'sw' }))
      expect(known.highlights).toContain('South-West Natural Light Exposure')

      const unknown = buildPropertyIntelligence(buildProperty({ cOrientation: 'xyz' }))
      expect(unknown.highlights).toContain('xyz Orientation')
    })

    it('excludes the real lowercase "no" door value (case-insensitive), includes other values', () => {
      const noDoor = buildPropertyIntelligence(buildProperty({ door: 'no' }))
      expect(noDoor.highlights.some(h => h.includes('Door'))).toBe(false)

      const NoDoor = buildPropertyIntelligence(buildProperty({ door: 'No' }))
      expect(NoDoor.highlights.some(h => h.includes('Door'))).toBe(false)

      const realDoor = buildPropertyIntelligence(buildProperty({ door: 'Security' }))
      expect(realDoor.highlights).toContain('Premium Security Entrance')
    })

    it('excludes negative-value swimmingPool/accessFrom from highlights', () => {
      const result = buildPropertyIntelligence(buildProperty({ swimmingPool: 'No', accessFrom: 'No access' }))
      expect(result.highlights.some(h => h.toLowerCase().includes('pool'))).toBe(false)
      expect(result.highlights.some(h => h.toLowerCase().includes('access'))).toBe(false)
    })
  })

  describe('lifestyleBenefits', () => {
    it('adds a furnished benefit only for a genuinely-furnished value', () => {
      const furnished = buildPropertyIntelligence(buildProperty({ furnished: 'furnished' }))
      expect(furnished.lifestyleBenefits.some(b => b.id === 'furnished')).toBe(true)

      const notFurnished = buildPropertyIntelligence(buildProperty({ furnished: 'no' }))
      expect(notFurnished.lifestyleBenefits.some(b => b.id === 'furnished')).toBe(false)
    })

    it('adds a sea-access benefit only when accessFrom is exactly "Sea"', () => {
      const sea = buildPropertyIntelligence(buildProperty({ accessFrom: 'Sea' }))
      expect(sea.lifestyleBenefits.some(b => b.id === 'sea')).toBe(true)

      const road = buildPropertyIntelligence(buildProperty({ accessFrom: 'Road' }))
      expect(road.lifestyleBenefits.some(b => b.id === 'sea')).toBe(false)
    })
  })

  describe('sellingPoints', () => {
    it('adds a "modern" point only for yearBuilt >= 2015', () => {
      expect(buildPropertyIntelligence(buildProperty({ yearBuilt: 2015 })).sellingPoints.some(s => s.id === 'modern')).toBe(true)
      expect(buildPropertyIntelligence(buildProperty({ yearBuilt: 2014 })).sellingPoints.some(s => s.id === 'modern')).toBe(false)
    })

    it('requires the A/A+ energy-class pattern exactly, rejects a bare "A-"', () => {
      expect(buildPropertyIntelligence(buildProperty({ energyClass: 'A+' })).sellingPoints.some(s => s.id === 'energy-class')).toBe(true)
      expect(buildPropertyIntelligence(buildProperty({ energyClass: 'A-' })).sellingPoints.some(s => s.id === 'energy-class')).toBe(false)
    })
  })

  describe('investmentSignals', () => {
    it('computes price-per-sqm only when both price and square are set', () => {
      const both = buildPropertyIntelligence(buildProperty({ price: 200000, square: 100 }))
      const sqm = both.investmentSignals.find(s => s.id === 'price-per-sqm')
      expect(sqm).toBeDefined()

      const priceOnly = buildPropertyIntelligence(buildProperty({ price: 200000 }))
      expect(priceOnly.investmentSignals.find(s => s.id === 'price-per-sqm')).toBeUndefined()
    })

    it('computes an estimated mortgage signal whenever price is set, independent of square', () => {
      const result = buildPropertyIntelligence(buildProperty({ price: 200000 }))
      const mortgage = result.investmentSignals.find(s => s.id === 'mortgage')
      expect(mortgage).toBeDefined()
      expect(mortgage?.note).toBe('80% LTV · 30yr at 7%')
    })
  })
})
