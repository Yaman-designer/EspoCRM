import { buildPropertyHealth, buildMarketDemand } from './property-health'
import type { RealEstateProperty } from '../types/property.types'
import type { DemandLevel } from './property-health'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RankTier = 'top' | 'above' | 'average' | 'below'

export interface MetricRank {
  position:   number        // 1 = best in portfolio
  total:      number        // total active properties
  percentile: number        // 0–100 (100 = top)
  delta:      number        // difference vs. portfolio average
  deltaLabel: string        // e.g. "+12 pts"
  tier:       RankTier
}

export interface PortfolioRanks {
  overall:    MetricRank
  health:     MetricRank
  demand:     MetricRank
  completion: MetricRank
  avgHealth:  number
  avgDemand:  number
  avgPricePerSqm?: number
  thisHealth:      number
  thisDemand:      number
  thisPricePerSqm?: number
  total:      number
}

// ── Demand level → normalized score (0–100) ───────────────────────────────────

const DEMAND_SCORE: Record<DemandLevel, number> = {
  'very-high': 100,
  'high':       70,
  'medium':     40,
  'low':        15,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((s, x) => s + x, 0) / xs.length
}

function rankPosition(id: string, sorted: { id: string }[]): number {
  const idx = sorted.findIndex(p => p.id === id)
  return idx === -1 ? sorted.length : idx + 1
}

function toMetricRank(
  position: number,
  total:    number,
  score:    number,
  average:  number,
  unit:     string,
): MetricRank {
  const percentile = total > 1
    ? Math.round(((total - position) / (total - 1)) * 100)
    : 100

  const delta = score - average
  const sign  = delta >= 0 ? '+' : '−'
  const tier: RankTier =
    percentile >= 80 ? 'top'     :
    percentile >= 55 ? 'above'   :
    percentile >= 30 ? 'average' : 'below'

  return {
    position,
    total,
    percentile,
    delta,
    deltaLabel: `${sign}${Math.round(Math.abs(delta))} ${unit}`,
    tier,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function computePortfolioRanks(
  current:   RealEstateProperty,
  portfolio: RealEstateProperty[],
): PortfolioRanks {
  const all   = portfolio.length > 0 ? portfolio : [current]
  const total = all.length

  // Score every property once
  const scored = all.map(p => {
    const h = buildPropertyHealth(p)
    const d = buildMarketDemand(p)
    return {
      id:          p.id,
      health:      h.score,
      demand:      DEMAND_SCORE[d.level],
      completion:  h.score,
      pricePerSqm: p.price != null && p.square != null && p.square > 0
        ? p.price / p.square
        : null,
    }
  })

  // Sort arrays (desc = rank 1 is best)
  const byHealth     = [...scored].sort((a, b) => b.health     - a.health)
  const byDemand     = [...scored].sort((a, b) => b.demand     - a.demand)
  const byCompletion = [...scored].sort((a, b) => b.completion - a.completion)
  const byOverall    = [...scored].sort((a, b) =>
    (b.health + b.demand + b.completion) - (a.health + a.demand + a.completion)
  )

  const thisScored = scored.find(s => s.id === current.id) ?? scored[0]

  // Portfolio averages
  const avgHealth     = avg(scored.map(s => s.health))
  const avgDemand     = avg(scored.map(s => s.demand))
  const avgCompletion = avg(scored.map(s => s.completion))
  const avgOverall    = avg(scored.map(s => (s.health + s.demand + s.completion) / 3))
  const avgPricePerSqm = (() => {
    const vals = scored.map(s => s.pricePerSqm).filter((v): v is number => v !== null)
    return vals.length > 0 ? avg(vals) : undefined
  })()

  const thisOverall = (thisScored.health + thisScored.demand + thisScored.completion) / 3

  return {
    overall:    toMetricRank(rankPosition(current.id, byOverall),    total, thisOverall,        avgOverall,    'pts'),
    health:     toMetricRank(rankPosition(current.id, byHealth),     total, thisScored.health,  avgHealth,     'pts'),
    demand:     toMetricRank(rankPosition(current.id, byDemand),     total, thisScored.demand,  avgDemand,     'pts'),
    completion: toMetricRank(rankPosition(current.id, byCompletion), total, thisScored.completion, avgCompletion, 'pts'),
    avgHealth:        Math.round(avgHealth),
    avgDemand:        Math.round(avgDemand),
    avgPricePerSqm,
    thisHealth:       thisScored.health,
    thisDemand:       thisScored.demand,
    thisPricePerSqm:  thisScored.pricePerSqm ?? undefined,
    total,
  }
}
