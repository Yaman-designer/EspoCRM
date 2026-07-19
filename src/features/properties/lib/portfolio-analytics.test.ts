import { describe, it, expect } from 'vitest'
import { computePortfolioRanks } from './portfolio-analytics'
import { buildProperty } from '@/test/builders/property'

describe('computePortfolioRanks', () => {
  it('ranks a solitary property (empty portfolio) as #1 of 1 with 100th percentile, "top" tier', () => {
    const current = buildProperty({ id: 'solo', price: 200000, square: 100 })
    const result = computePortfolioRanks(current, [])
    expect(result.total).toBe(1)
    expect(result.overall.position).toBe(1)
    expect(result.overall.percentile).toBe(100)
    expect(result.overall.tier).toBe('top')
  })

  it('ranks the best-scoring property #1 and the worst last within a real portfolio', () => {
    const best = buildProperty({
      id: 'best', price: 300000, square: 100,
      imagesIds: ['a', 'b', 'c', 'd', 'e'], bedroomCount: 3, bathroomCount: 2,
      description: 'x'.repeat(120), assignedUserName: 'Agent', addressCity: 'Athens',
    })
    const worst = buildProperty({ id: 'worst' })
    const portfolio = [best, worst]

    const bestRank = computePortfolioRanks(best, portfolio)
    expect(bestRank.health.position).toBe(1)
    expect(bestRank.health.tier).toBe('top')

    const worstRank = computePortfolioRanks(worst, portfolio)
    expect(worstRank.health.position).toBe(2)
    expect(worstRank.health.tier).toBe('below')
  })

  it('falls back to [current] when given an empty portfolio array, not an empty result', () => {
    const current = buildProperty({ id: 'only-one' })
    const result = computePortfolioRanks(current, [])
    expect(result.total).toBe(1)
    expect(result.thisHealth).toBeDefined()
  })

  it('computes avgPricePerSqm only from properties that have both price and square, undefined if none qualify', () => {
    const withSqm = buildProperty({ id: 'a', price: 200000, square: 100 })
    const withoutSqm = buildProperty({ id: 'b', price: 200000 })
    const result = computePortfolioRanks(withSqm, [withSqm, withoutSqm])
    expect(result.avgPricePerSqm).toBe(2000)

    const noneQualify = computePortfolioRanks(withoutSqm, [withoutSqm])
    expect(noneQualify.avgPricePerSqm).toBeUndefined()
  })

  it('deltaLabel uses a real minus sign (−) for negative deltas, plus for non-negative', () => {
    const strong = buildProperty({
      id: 'strong', imagesIds: ['a', 'b', 'c', 'd', 'e'], price: 1, bedroomCount: 1,
      bathroomCount: 1, square: 1, description: 'x'.repeat(120), assignedUserName: 'Agent', addressCity: 'Athens',
    })
    const weak = buildProperty({ id: 'weak' })
    const weakRank = computePortfolioRanks(weak, [strong, weak])
    expect(weakRank.health.deltaLabel.startsWith('−')).toBe(true)

    const strongRank = computePortfolioRanks(strong, [strong, weak])
    expect(strongRank.health.deltaLabel.startsWith('+')).toBe(true)
  })
})
