import type { RealEstateProperty } from '../types/property.types'
import type { PropertyNarrative } from '../lib/property-narrative'

export interface BriefingViewModel {
  insight: string
  supporting: string
  requestTypeLabel: string | null
}

type BriefingFields = Pick<RealEstateProperty,
  'status' | 'type' | 'locationName' | 'regionLocationName' | 'requestType' | 'propertyCode'
>

/**
 * Splits a one-or-two-sentence narrative into an "insight" line and an
 * optional "supporting context" line, breaking at the first sentence
 * boundary when one exists in a reasonable position, and at the nearest
 * word boundary otherwise — so the visual break between the two stacked
 * lines never lands mid-word.
 */
function splitInsight(text: string): [insight: string, supporting: string] {
  const periodIdx = text.indexOf('.')
  if (periodIdx > 30 && periodIdx < 140) {
    return [text.slice(0, periodIdx + 1), text.slice(periodIdx + 1).trim()]
  }
  const hardCut   = Math.min(90, text.length)
  const lastSpace = text.lastIndexOf(' ', hardCut)
  const cut       = lastSpace > 30 ? lastSpace : hardCut
  return [text.slice(0, cut), text.slice(cut).trim()]
}

/**
 * Shapes ExecutiveBriefingCard's insight text. `narrative` is a
 * deterministic, rule-based editorial generator (see property-narrative.ts —
 * "No AI, no randomness"); when it has no summary, this falls back to the
 * same templated sentence the component used to build inline.
 */
export function buildBriefingViewModel(
  narrative: PropertyNarrative,
  property: BriefingFields,
  displayName: string,
): BriefingViewModel {
  const locationLabel = property.locationName?.trim() || property.regionLocationName?.trim() || null

  const briefingText = narrative.summary
    ?? `${displayName} is a ${(property.type ?? 'property').toLowerCase()}${locationLabel ? ` in ${locationLabel}` : ''} — currently ${property.status.toLowerCase()}.`

  const [insight, supporting] = splitInsight(briefingText)

  return {
    insight,
    supporting,
    requestTypeLabel: property.requestType?.trim() ? `For ${property.requestType.trim()}` : null,
  }
}
