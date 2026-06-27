import type { RealEstateProperty } from '../types/property.types'

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

export type LeadTier = 'hot' | 'warm' | 'cold'

export interface LeadQuality {
  score:  number        // 0–100
  tier:   LeadTier
  label:  string
  reason: string
}

export type ActionPriority = 'urgent' | 'high' | 'medium'

export interface NextAction {
  id:          string
  priority:    ActionPriority
  action:      string
  description: string
}

// ── Health Score ──────────────────────────────────────────────────────────────

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

  if (p.type && ['Villa', 'House', 'Apartment'].includes(p.type)) {
    signals.push({ id: 'type', label: `${p.type} — high demand segment`, positive: true })
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

// ── Lead Quality ──────────────────────────────────────────────────────────────

export function buildLeadQuality(
  p:             RealEstateProperty,
  health:        PropertyHealth,
  pipelineStage: string,
): LeadQuality {
  const stageBase: Record<string, number> = {
    lead: 15, qualified: 35, negotiation: 65, contract: 85, closed: 100,
  }
  let score = stageBase[pipelineStage] ?? 15

  // Health contribution — max 40 points
  score += Math.round(health.score * 0.4)

  // Agent bonus
  if (p.assignedUserName) score = Math.min(100, score + 8)

  score = Math.min(100, score)

  const tier: LeadTier = score >= 68 ? 'hot' : score >= 40 ? 'warm' : 'cold'
  const label           = tier === 'hot' ? 'Hot Lead' : tier === 'warm' ? 'Warm Lead' : 'Cold Lead'
  const reason =
    tier === 'hot'  ? 'Advanced stage with strong listing quality' :
    tier === 'warm' ? 'Active deal — listing needs improvement' :
    'Incomplete listing is reducing conversion odds'

  return { score, tier, label, reason }
}

// ── Next Actions ──────────────────────────────────────────────────────────────

export function buildNextActions(
  p:             RealEstateProperty,
  health:        PropertyHealth,
  pipelineStage: string,
): NextAction[] {
  const actions: NextAction[] = []

  if (!p.assignedUserName) {
    actions.push({
      id: 'assign-agent', priority: 'urgent',
      action:      'Assign a listing agent',
      description: 'Required to advance the deal pipeline',
    })
  }

  if (p.status === 'Reserved' || p.status === 'Pending') {
    actions.push({
      id: 'prepare-contract', priority: 'urgent',
      action:      'Prepare sale contract',
      description: 'Property reserved — move to contract stage now',
    })
  }

  const mediaFactor = health.factors.find(f => f.id === 'media')
  if (mediaFactor?.status === 'fail') {
    actions.push({
      id: 'upload-photos', priority: 'urgent',
      action:      'Upload property photos',
      description: 'Listings without photos receive 80% fewer enquiries',
    })
  }

  if (p.status === 'Available' && (health.grade === 'A' || health.grade === 'B')) {
    actions.push({
      id: 'schedule-viewing', priority: 'high',
      action:      'Schedule client viewing',
      description: 'Property is market-ready — book the next showing',
    })
  }

  const failFactors = health.factors.filter(f => f.status === 'fail' && f.id !== 'media')
  if (failFactors.length > 0) {
    actions.push({
      id: 'complete-listing', priority: 'high',
      action:      'Complete listing data',
      description: failFactors.slice(0, 2).map(f => f.label).join(', ') + ' missing',
    })
  }

  const descFactor = health.factors.find(f => f.id === 'description')
  if (descFactor?.status !== 'pass' && !actions.find(a => a.id === 'complete-listing')) {
    actions.push({
      id: 'write-description', priority: 'medium',
      action:      'Write property description',
      description: 'Improves search ranking and buyer confidence',
    })
  }

  const order: Record<ActionPriority, number> = { urgent: 0, high: 1, medium: 2 }
  return actions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3)
}
