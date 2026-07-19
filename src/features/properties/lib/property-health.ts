import type { RealEstateProperty } from '../types/property.types'
import { resolvePropertyType } from '../domain/property-type.registry'

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
export function buildPropertyHealth(p: RealEstateProperty): PropertyHealth {
  const factors: HealthFactor[] = []

  // Photography — most impactful on buyer interest
  const imgCount = (p.imagesIds?.length ?? 0) + (p.mainImageId ? 1 : 0)
  factors.push({
    id:    'media',
    label: 'Photography',
    status: imgCount >= 5 ? 'pass' : imgCount >= 1 ? 'warning' : 'fail',
    note:   imgCount === 0
      ? 'No photos — required for buyer interest'
      : imgCount < 5
        ? `${imgCount} photo${imgCount === 1 ? '' : 's'} — add more for impact`
        : undefined,
  })

  // Asking price
  factors.push({
    id:    'price',
    label: 'Asking price',
    status: p.price != null ? 'pass' : 'fail',
    note:   p.price == null ? 'Price required for buyer enquiries' : undefined,
  })

  // Core specifications
  const specCount = [p.bedroomCount, p.bathroomCount, p.square].filter(v => v != null).length
  factors.push({
    id:    'specs',
    label: 'Specifications',
    status: specCount >= 3 ? 'pass' : specCount >= 1 ? 'warning' : 'fail',
    note:   specCount < 3 ? 'Add bedrooms, bathrooms, and area' : undefined,
  })

  // Description
  const descLen = p.description?.trim().length ?? 0
  factors.push({
    id:    'description',
    label: 'Description',
    status: descLen > 100 ? 'pass' : descLen > 0 ? 'warning' : 'fail',
    note:   descLen === 0 ? 'Write a property description' : descLen <= 100 ? 'Description too short' : undefined,
  })

  // Agent assignment
  factors.push({
    id:    'agent',
    label: 'Agent assigned',
    status: p.assignedUserName ? 'pass' : 'warning',
    note:   !p.assignedUserName ? 'Assign a listing agent' : undefined,
  })

  // Location data
  factors.push({
    id:    'location',
    label: 'Location',
    status: (p.locationName || p.addressCity) ? 'pass' : 'fail',
    note:   !(p.locationName || p.addressCity) ? 'Add location details' : undefined,
  })

  const raw   = factors.reduce((s, f) => s + (f.status === 'pass' ? 1 : f.status === 'warning' ? 0.5 : 0), 0)
  const score = Math.round((raw / factors.length) * 100)

  const grade: HealthGrade = score >= 85 ? 'A' : score >= 65 ? 'B' : score >= 40 ? 'C' : 'D'
  const label               = grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Fair' : 'Poor'

  return { score, grade, label, factors }
}

// ── Market Demand ─────────────────────────────────────────────────────────────

export function buildMarketDemand(p: RealEstateProperty): MarketDemand {
  const signals: DemandSignal[] = []

  if (p.type && resolvePropertyType(p.type).category === 'residential') {
    signals.push({ id: 'type', label: `${resolvePropertyType(p.type).label} — high demand segment`, positive: true })
  }
  if (p.swimmingPool && !/^no$/i.test(p.swimmingPool.trim())) {
    signals.push({ id: 'pool', label: 'Swimming pool — buyer premium', positive: true })
  }
  if (p.accessFrom === 'Sea') {
    signals.push({ id: 'sea', label: 'Sea access — rare inventory', positive: true })
  }
  if (p.energyClass && /^A/.test(p.energyClass)) {
    signals.push({ id: 'energy', label: `Energy class ${p.energyClass} — low running costs`, positive: true })
  }
  if (p.isNewListing) {
    signals.push({ id: 'new', label: 'New to market — peak visibility window', positive: true })
  }
  if (p.isFeatured || p.isPremium) {
    signals.push({ id: 'featured', label: 'Featured listing — 3× enquiry rate', positive: true })
  }
  if (p.yearBuilt && p.yearBuilt < 1975) {
    signals.push({ id: 'age', label: 'Pre-1975 build — renovation likely expected', positive: false })
  }

  const pos                  = signals.filter(s => s.positive).length
  const level: DemandLevel   = pos >= 4 ? 'very-high' : pos >= 2 ? 'high' : pos >= 1 ? 'medium' : 'low'
  const label                = level === 'very-high' ? 'Very High' : level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'

  return { level, label, signals }
}

