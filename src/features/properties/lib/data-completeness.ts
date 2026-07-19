import type { RealEstateProperty } from '../types/property.types'

export type CompletenessLevel = 'minimal' | 'partial' | 'complete' | 'showcase'

export interface DataCompleteness {
  level:          CompletenessLevel
  score:          number    // 0–100
  hasMedia:       boolean
  hasPrice:       boolean
  hasLocation:    boolean
  hasSpecs:       boolean
  hasDescription: boolean
  hasAgent:       boolean
  missing:        string[]  // user-friendly labels for absent fields
}

// Weights must sum to 100.
const W = {
  media:       25,
  price:       20,
  location:    15,
  specs:       15,
  description: 12,
  type:         5,
  agent:        5,
  requestType:  3,
} as const

/**
 * Real business-rule gate, not just a display score — property-lifecycle.
 * rules.ts's canPublish() requires this score to clear
 * MIN_COMPLETENESS_TO_PUBLISH before a property may transition to 'Active';
 * PropertyListRenderer.tsx's publish filter checks it directly too.
 *
 * Distinct from property-health.ts's buildPropertyHealth, despite both
 * producing a 0-100 number from overlapping fields (media/price/location/
 * specs/description/agent) — that function's pass/warning/fail grading
 * feeds only display and advisory signals, never a transition gate. Verified
 * this pass (Architecture Debt Rank #5) that merging the two would mean
 * guessing which weighting scheme should govern a real publish rule; kept
 * deliberately separate. See the Rank #5 Certification Report.
 */
export function getDataCompleteness(p: RealEstateProperty): DataCompleteness {
  const hasMedia       = !!(p.mainImageId || p.imagesIds?.length)
  const hasPrice       = p.price != null
  const hasLocation    = !!(p.addressCity || p.locationName)
  const hasSpecs       = p.bedroomCount != null || p.bathroomCount != null || p.square != null
  const hasDescription = !!(p.description?.trim())
  const hasAgent       = !!p.assignedUserName
  const hasType        = !!p.type
  const hasRequestType = !!p.requestType

  const missing: string[] = []
  if (!hasMedia)       missing.push('Photos')
  if (!hasPrice)       missing.push('Price')
  if (!hasLocation)    missing.push('Location')
  if (!hasSpecs)       missing.push('Specifications')
  if (!hasDescription) missing.push('Description')
  if (!hasAgent)       missing.push('Agent')
  if (!hasType)        missing.push('Property type')

  const score =
    (hasMedia       ? W.media       : 0) +
    (hasPrice       ? W.price       : 0) +
    (hasLocation    ? W.location    : 0) +
    (hasSpecs       ? W.specs       : 0) +
    (hasDescription ? W.description : 0) +
    (hasType        ? W.type        : 0) +
    (hasAgent       ? W.agent       : 0) +
    (hasRequestType ? W.requestType : 0)

  const level: CompletenessLevel =
    score >= 90 ? 'showcase' :
    score >= 65 ? 'complete' :
    score >= 35 ? 'partial'  : 'minimal'

  return { level, score, hasMedia, hasPrice, hasLocation, hasSpecs, hasDescription, hasAgent, missing }
}
