import type { RealEstateProperty } from '../types/property.types'
import { resolvePropertyType, getPropertyTypeLabel } from '../domain/property-type.registry'

/** i18next translate function for the 'properties' namespace — required so
 *  this stays a plain data function with no i18n import of its own. Test
 *  callers that don't render anything can pass a trivial `(key) => key`. */
export type Translator = (key: string, options?: Record<string, unknown>) => string

// ── Types ─────────────────────────────────────────────────────────────────────

export type HealthGrade = 'A' | 'B' | 'C' | 'D'

export interface HealthFactor {
  id:     string
  label:  string
  status: 'pass' | 'warning' | 'fail'
  note?:  string
}

export interface PropertyHealth {
  score:   number        // 0–100
  grade:   HealthGrade
  label:   'Excellent' | 'Good' | 'Fair' | 'Poor'
  factors: HealthFactor[]
}

export type DemandLevel = 'very-high' | 'high' | 'medium' | 'low'

export interface DemandSignal {
  id:       string
  label:    string
  positive: boolean
}

export interface MarketDemand {
  level:   DemandLevel
  label:   string
  signals: DemandSignal[]
}

// ── Health Score ──────────────────────────────────────────────────────────────

/**
 * CRM-facing listing-quality score for the detail page and Wizard review
 * step — NOT the same concern as data-completeness.ts's getDataCompleteness,
 * despite both producing a 0-100 number from overlapping raw fields.
 * getDataCompleteness is load-bearing business logic (property-lifecycle.
 * rules.ts's canPublish() gates the Active-status transition on its score;
 * PropertyListRenderer.tsx's publish filter does too) with its own weighting
 * (includes type/requestType, excludes nothing this function checks). This
 * function's pass/warning/fail-per-factor grading feeds only display
 * signals (buildMarketDemand below) — never a business-rule gate.
 * Architecture Debt Rank #5 considered merging the two; verified this pass
 * (fresh dependency trace, not assumed) that doing so would mean guessing
 * which of two different weighting schemes should govern a real
 * publish-eligibility rule — out of scope without a product decision. Kept
 * deliberately separate; see the Rank #5 Certification Report.
 */
export function buildPropertyHealth(p: RealEstateProperty, t: Translator): PropertyHealth {
  const factors: HealthFactor[] = []
  const h = 'wizard.review.health'

  // Photography — most impactful on buyer interest
  const imgCount = (p.imagesIds?.length ?? 0) + (p.mainImageId ? 1 : 0)
  factors.push({
    id:    'media',
    label: t(`${h}.factors.media.label`),
    status: imgCount >= 5 ? 'pass' : imgCount >= 1 ? 'warning' : 'fail',
    note:   imgCount === 0
      ? t(`${h}.factors.media.noteZero`)
      : imgCount < 5
        ? t(`${h}.factors.media.noteFew`, { count: imgCount })
        : undefined,
  })

  // Asking price
  factors.push({
    id:    'price',
    label: t(`${h}.factors.price.label`),
    status: p.price != null ? 'pass' : 'fail',
    note:   p.price == null ? t(`${h}.factors.price.note`) : undefined,
  })

  // Core specifications
  const specCount = [p.bedroomCount, p.bathroomCount, p.square].filter(v => v != null).length
  factors.push({
    id:    'specs',
    label: t(`${h}.factors.specs.label`),
    status: specCount >= 3 ? 'pass' : specCount >= 1 ? 'warning' : 'fail',
    note:   specCount < 3 ? t(`${h}.factors.specs.note`) : undefined,
  })

  // Description
  const descLen = p.description?.trim().length ?? 0
  factors.push({
    id:    'description',
    label: t(`${h}.factors.description.label`),
    status: descLen > 100 ? 'pass' : descLen > 0 ? 'warning' : 'fail',
    note:   descLen === 0
      ? t(`${h}.factors.description.noteEmpty`)
      : descLen <= 100 ? t(`${h}.factors.description.noteShort`) : undefined,
  })

  // Agent assignment
  factors.push({
    id:    'agent',
    label: t(`${h}.factors.agent.label`),
    status: p.assignedUserName ? 'pass' : 'warning',
    note:   !p.assignedUserName ? t(`${h}.factors.agent.note`) : undefined,
  })

  // Location data
  factors.push({
    id:    'location',
    label: t(`${h}.factors.location.label`),
    status: (p.locationName || p.addressCity) ? 'pass' : 'fail',
    note:   !(p.locationName || p.addressCity) ? t(`${h}.factors.location.note`) : undefined,
  })

  const raw   = factors.reduce((s, f) => s + (f.status === 'pass' ? 1 : f.status === 'warning' ? 0.5 : 0), 0)
  const score = Math.round((raw / factors.length) * 100)

  const grade: HealthGrade = score >= 85 ? 'A' : score >= 65 ? 'B' : score >= 40 ? 'C' : 'D'
  const label               = grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Fair' : 'Poor'

  return { score, grade, label, factors }
}

// ── Market Demand ─────────────────────────────────────────────────────────────

export function buildMarketDemand(p: RealEstateProperty, t: Translator): MarketDemand {
  const signals: DemandSignal[] = []
  const d = 'wizard.review.demand'

  if (p.type && resolvePropertyType(p.type).category === 'residential') {
    signals.push({ id: 'type', label: t(`${d}.typeSegment`, { type: getPropertyTypeLabel(p.type, t) }), positive: true })
  }
  if (p.swimmingPool && !/^no$/i.test(p.swimmingPool.trim())) {
    signals.push({ id: 'pool', label: t(`${d}.pool`), positive: true })
  }
  if (p.accessFrom === 'Sea') {
    signals.push({ id: 'sea', label: t(`${d}.sea`), positive: true })
  }
  if (p.energyClass && /^A/.test(p.energyClass)) {
    signals.push({ id: 'energy', label: t(`${d}.energy`, { energyClass: p.energyClass }), positive: true })
  }
  if (p.isNewListing) {
    signals.push({ id: 'new', label: t(`${d}.newListing`), positive: true })
  }
  if (p.isFeatured || p.isPremium) {
    signals.push({ id: 'featured', label: t(`${d}.featured`), positive: true })
  }
  if (p.yearBuilt && p.yearBuilt < 1975) {
    signals.push({ id: 'age', label: t(`${d}.oldBuild`), positive: false })
  }

  const pos                  = signals.filter(s => s.positive).length
  const level: DemandLevel   = pos >= 4 ? 'very-high' : pos >= 2 ? 'high' : pos >= 1 ? 'medium' : 'low'
  const label                = t(`${d}.level.${level === 'very-high' ? 'veryHigh' : level}`)

  return { level, label, signals }
}

