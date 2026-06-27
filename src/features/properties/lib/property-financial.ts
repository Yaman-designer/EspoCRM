import type { RealEstateProperty } from '../types/property.types'
import type { MarketDemand, PropertyHealth } from './property-health'

// ── Public types ──────────────────────────────────────────────────────────────

export interface MonthlyBar {
  label:       string
  value:       number   // absolute projected value
  highlighted: boolean
}

export interface FinancialIntelligence {
  projectedRevenue12M: number | null  // 12-month projected appreciation value
  yoyGrowthPct:        number         // estimated YoY growth %
  investmentScore:     number         // 0–10 composite
  volatilityIndex:     number         // e.g. 0.14
  volatilityLabel:     'Low' | 'Medium' | 'High'
  estimatedROI:        number         // % ROI estimate
  annualYield:         number         // % net annual yield
  marketPosition:      string         // e.g. "Top 5% Market Segment"
  alphaPct:            number         // alpha vs 4% market baseline
  chartBars:           MonthlyBar[]   // 7-bar 1Y projection
  confidencePct:       number         // 0–100 briefing confidence
  opportunityScore:    number         // 0–100
  riskProfile:         'Low' | 'Moderate' | 'High'
  demandLabel:         string         // "Peak" | "High" | "Moderate" | "Low"
}

// ── Growth/yield tables by demand level ──────────────────────────────────────

const GROWTH_RATE:   Record<string, number> = {
  'very-high': 14.2,
  'high':       9.8,
  'medium':     5.5,
  'low':        2.2,
}

const ROI_ESTIMATE:  Record<string, number> = {
  'very-high': 7.2,
  'high':      5.8,
  'medium':    4.1,
  'low':       2.3,
}

const YIELD_ESTIMATE: Record<string, number> = {
  'very-high': 5.8,
  'high':      4.6,
  'medium':    3.2,
  'low':       1.8,
}

const VOLATILITY: Record<string, number> = {
  'very-high': 0.08,
  'high':      0.14,
  'medium':    0.23,
  'low':       0.38,
}

const MARKET_POSITION: Record<string, string> = {
  'very-high': 'Top 5% Market Segment',
  'high':      'Top 15% Market Segment',
  'medium':    'Mid-Market Segment',
  'low':       'Value Segment',
}

const DEMAND_DISPLAY: Record<string, string> = {
  'very-high': 'Peak',
  'high':      'High',
  'medium':    'Moderate',
  'low':       'Low',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic numeric hash of a string — same id → same jitter. */
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * Builds 7 monthly projection bars for the financial chart.
 * Values are the estimated monthly contribution to the 12M projected value.
 * Uses a deterministic ascending curve with slight per-property jitter.
 */
function buildChartBars(
  projectedRevenue12M: number | null,
  propertyId:          string,
): MonthlyBar[] {
  const LABELS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const base   = projectedRevenue12M ?? 0
  if (base === 0) return LABELS.map((label, i) => ({ label, value: 0, highlighted: i === 6 }))

  const jitter = hashId(propertyId)
  const monthly = base / 12

  return LABELS.map((label, i) => {
    // Ascending ramp: 0.6 → 1.0 with slight id-based variance
    const ramp    = 0.60 + i * 0.065
    const noise   = (((jitter >> i) & 0xf) / 0xf - 0.5) * 0.06
    const factor  = Math.max(0.55, Math.min(1.1, ramp + noise))
    return {
      label,
      value:       Math.round(monthly * factor),
      highlighted: i === 6,
    }
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export function buildFinancialIntelligence(
  p:      RealEstateProperty,
  health: PropertyHealth,
  demand: MarketDemand,
): FinancialIntelligence {
  const level = demand.level

  const yoyGrowthPct    = GROWTH_RATE[level]   ?? 5.5
  const estimatedROI    = ROI_ESTIMATE[level]  ?? 4.1
  const annualYield     = YIELD_ESTIMATE[level] ?? 3.2
  const volatilityIndex = VOLATILITY[level]    ?? 0.23
  const marketPosition  = MARKET_POSITION[level] ?? 'Market Segment'
  const demandLabel     = DEMAND_DISPLAY[level] ?? 'Moderate'

  const projectedRevenue12M = p.price != null
    ? Math.round(p.price * (yoyGrowthPct / 100))
    : null

  // Investment score: composite of health (0–10 scale) + positive demand signals
  const posSignals   = demand.signals.filter(s => s.positive).length
  const baseScore    = (health.score / 100) * 5.5
  const sigBonus     = Math.min(3.0, posSignals * 0.75)
  const yearBonus    = p.yearBuilt && p.yearBuilt >= 2015 ? 0.5 : 0
  const energyBonus  = p.energyClass ? 0.3 : 0
  const investmentScore = Math.min(10, +((baseScore + sigBonus + yearBonus + energyBonus).toFixed(1)))

  const volatilityLabel: FinancialIntelligence['volatilityLabel'] =
    volatilityIndex < 0.15 ? 'Low' : volatilityIndex < 0.3 ? 'Medium' : 'High'

  const alphaPct = Math.round((yoyGrowthPct - 4.0) * 10) / 10

  const chartBars = buildChartBars(projectedRevenue12M, p.id)

  // Confidence: health score anchors this (85–98 range)
  const confidencePct = Math.round(85 + (health.score / 100) * 13)

  // Opportunity score: 0–100
  const opportunityScore = Math.min(100, Math.round(
    health.score * 0.5 + posSignals * 6 + (p.yearBuilt && p.yearBuilt >= 2015 ? 5 : 0),
  ))

  const riskProfile: FinancialIntelligence['riskProfile'] =
    level === 'very-high' || level === 'high' ? 'Low'
    : level === 'medium' ? 'Moderate'
    : 'High'

  return {
    projectedRevenue12M,
    yoyGrowthPct,
    investmentScore,
    volatilityIndex,
    volatilityLabel,
    estimatedROI,
    annualYield,
    marketPosition,
    alphaPct,
    chartBars,
    confidencePct,
    opportunityScore,
    riskProfile,
    demandLabel,
  }
}
