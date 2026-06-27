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
  purpose:      3,
} as const

export function getDataCompleteness(p: RealEstateProperty): DataCompleteness {
  const hasMedia       = !!(p.mainImageId || p.imagesIds?.length)
  const hasPrice       = p.price != null
  const hasLocation    = !!(p.addressCity || p.locationName)
  const hasSpecs       = p.bedroomCount != null || p.bathroomCount != null || p.square != null
  const hasDescription = !!(p.description?.trim())
  const hasAgent       = !!p.assignedUserName
  const hasType        = !!p.type
  const hasPurpose     = !!p.purpose

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
    (hasPurpose     ? W.purpose     : 0)

  const level: CompletenessLevel =
    score >= 90 ? 'showcase' :
    score >= 65 ? 'complete' :
    score >= 35 ? 'partial'  : 'minimal'

  return { level, score, hasMedia, hasPrice, hasLocation, hasSpecs, hasDescription, hasAgent, missing }
}
