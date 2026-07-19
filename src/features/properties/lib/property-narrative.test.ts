import { describe, it, expect } from 'vitest'
import { buildPropertyNarrative } from './property-narrative'
import { buildProperty } from '@/test/builders/property'

describe('buildPropertyNarrative', () => {
  it('is deterministic: identical input always produces identical output', () => {
    const property = buildProperty({ type: 'villa', accessFrom: 'Sea' })
    expect(buildPropertyNarrative(property)).toEqual(buildPropertyNarrative(property))
  })

  it('returns null headline/summary sections gracefully for a listing with zero signals and no type/location', () => {
    const result = buildPropertyNarrative(buildProperty({}))
    // typeLabel falls back to 'residence' for an unset type — headline still
    // falls through every signal branch to null since 'residence' isn't
    // considered distinctive on its own.
    expect(result.headline).toBeNull()
    expect(result.locationNarrative).toBeNull()
    expect(result.lifestyleNarrative).toBeNull()
    expect(result.sellingNarrative).toBeNull()
    // Summary always has a final catch-all branch, never null.
    expect(result.summary).not.toBeNull()
  })

  it('sea access takes headline priority over every other signal', () => {
    const result = buildPropertyNarrative(buildProperty({
      type: 'villa', accessFrom: 'Sea', swimmingPool: 'External', cOrientation: 'sw',
    }))
    expect(result.headline).toBe('Sea-Access Villa')
    expect(result.summary).toContain('sea access')
  })

  it('maps a legacy Title-Case type through TYPE_LABEL_OVERRIDES', () => {
    const result = buildPropertyNarrative(buildProperty({ type: 'Villa', accessFrom: 'Sea' }))
    expect(result.headline).toBe('Sea-Access Villa')
  })

  it('falls back to a category-derived noun for an unrecognized type value', () => {
    const result = buildPropertyNarrative(buildProperty({ type: 'totally-unknown-type', accessFrom: 'Sea' }))
    // Unknown types resolve via resolvePropertyType(...).category; asserting
    // only that a headline is produced without throwing, not the exact noun,
    // since that depends on property-type.registry.ts's own classification.
    expect(result.headline).toContain('Sea-Access')
  })

  it('location narrative combines location + city when both are present, uses either alone otherwise', () => {
    const both = buildPropertyNarrative(buildProperty({ locationName: 'Kolonaki', addressCity: 'Athens' }))
    expect(both.locationNarrative).toContain('Kolonaki')
    expect(both.locationNarrative).toContain('Athens')

    const cityOnly = buildPropertyNarrative(buildProperty({ addressCity: 'Athens' }))
    expect(cityOnly.locationNarrative).toContain('Athens')

    const neither = buildPropertyNarrative(buildProperty({}))
    expect(neither.locationNarrative).toBeNull()
  })

  it('lifestyle narrative includes at most 3 sentences even when every signal is present', () => {
    const result = buildPropertyNarrative(buildProperty({
      swimmingPool: 'External', balcony: true, cHeatingMedium: 'heatpump',
      cOrientation: 'sw', furnished: 'furnished', energyClass: 'A', garage: 'Yes',
    }))
    expect(result.lifestyleNarrative).not.toBeNull()
    const sentenceCount = (result.lifestyleNarrative ?? '').split('. ').length
    expect(sentenceCount).toBeLessThanOrEqual(3)
  })

  it('selling narrative adds a closing line only when 2+ strong signals converge', () => {
    const single = buildPropertyNarrative(buildProperty({ swimmingPool: 'External' }))
    expect(single.sellingNarrative).not.toContain('early consideration')

    const multi = buildPropertyNarrative(buildProperty({
      accessFrom: 'Sea', energyClass: 'A', swimmingPool: 'External', cOrientation: 'sw',
    }))
    expect(multi.sellingNarrative).toContain('early consideration')
  })
})
