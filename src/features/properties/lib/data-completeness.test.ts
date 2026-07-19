import { describe, it, expect } from 'vitest'
import { getDataCompleteness } from './data-completeness'
import { buildProperty } from '@/test/builders/property'

// property-lifecycle.rules.ts's canPublish() gates the 'Active' status
// transition directly on this function's score — these tests protect that
// real business rule, not just a display number (Architecture Debt Rank #5
// documented this distinction; Rank #7 adds the coverage that was missing).
describe('getDataCompleteness', () => {
  it('scores 0 and level "minimal" for a listing with none of the weighted fields', () => {
    const result = getDataCompleteness(buildProperty({}))
    expect(result.score).toBe(0)
    expect(result.level).toBe('minimal')
    expect(result.missing).toEqual(
      expect.arrayContaining(['Photos', 'Price', 'Location', 'Specifications', 'Description', 'Agent', 'Property type']),
    )
  })

  it('scores 100 and level "showcase" when every weighted field is present', () => {
    const result = getDataCompleteness(buildProperty({
      mainImageId: 'img-1',
      price: 250000,
      addressCity: 'Athens',
      bedroomCount: 3,
      description: 'A description',
      assignedUserName: 'Agent Name',
      type: 'apartment',
      requestType: 'Sale',
    }))
    expect(result.score).toBe(100)
    expect(result.level).toBe('showcase')
    expect(result.missing).toEqual([])
  })

  it('applies the documented weights exactly: media=25, price=20, location=15, specs=15, description=12, type=5, agent=5, requestType=3', () => {
    const mediaOnly = getDataCompleteness(buildProperty({ mainImageId: 'img-1' }))
    expect(mediaOnly.score).toBe(25)

    const priceOnly = getDataCompleteness(buildProperty({ price: 1 }))
    expect(priceOnly.score).toBe(20)

    const typeAndRequestType = getDataCompleteness(buildProperty({ type: 'apartment', requestType: 'Sale' }))
    expect(typeAndRequestType.score).toBe(8)
  })

  it('level boundaries: showcase>=90, complete>=65, partial>=35, else minimal', () => {
    // media(25) + price(20) + location(15) + specs(15) = 75 -> complete, not showcase
    const complete = getDataCompleteness(buildProperty({
      mainImageId: 'img-1', price: 1, addressCity: 'Athens', bedroomCount: 1,
    }))
    expect(complete.score).toBe(75)
    expect(complete.level).toBe('complete')

    // price(20) + location(15) = 35 -> exactly the partial boundary
    const partial = getDataCompleteness(buildProperty({ price: 1, addressCity: 'Athens' }))
    expect(partial.score).toBe(35)
    expect(partial.level).toBe('partial')
  })

  it('treats mainImageId OR a non-empty imagesIds array as sufficient for media (not both required)', () => {
    const viaMain = getDataCompleteness(buildProperty({ mainImageId: 'img-1' }))
    expect(viaMain.hasMedia).toBe(true)

    const viaGallery = getDataCompleteness(buildProperty({ imagesIds: ['a'] }))
    expect(viaGallery.hasMedia).toBe(true)

    const emptyGallery = getDataCompleteness(buildProperty({ imagesIds: [] }))
    expect(emptyGallery.hasMedia).toBe(false)
  })

  it('treats any one of bedroomCount/bathroomCount/square as sufficient for specs', () => {
    expect(getDataCompleteness(buildProperty({ bathroomCount: 1 })).hasSpecs).toBe(true)
    expect(getDataCompleteness(buildProperty({ square: 50 })).hasSpecs).toBe(true)
    expect(getDataCompleteness(buildProperty({})).hasSpecs).toBe(false)
  })

  it('treats a whitespace-only description as absent', () => {
    const result = getDataCompleteness(buildProperty({ description: '   ' }))
    expect(result.hasDescription).toBe(false)
    expect(result.missing).toContain('Description')
  })
})
