/**
 * Shared display utilities for the properties feature.
 */

import type { RealEstateProperty } from '../types/property.types'
import { formatCurrency, formatDate as baseFmtDate } from '@/lib/format'

// ── Price formatting ──────────────────────────────────────────────────────────

// Currency-compact Intl formatter — no equivalent in lib/format (different notation and decimals)
const PRICE_FMT_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})

/**
 * Formats a price as USD.
 * Pass compact=true in space-constrained contexts (e.g. detail sheet identity strip)
 * to use abbreviated notation for values ≥ $1M (e.g. $1.5M instead of $1,500,000).
 */
export function fmtPrice(price: number, compact = false): string {
  if (compact && price >= 1_000_000) return PRICE_FMT_COMPACT.format(price)
  return formatCurrency(price)
}

// ── Date formatting ───────────────────────────────────────────────────────────

const SHORT_DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const LONG_DATE_OPTS:  Intl.DateTimeFormatOptions = { month: 'long',  day: 'numeric', year: 'numeric' }

export function fmtDate(iso: string | undefined, style: 'short' | 'long' = 'short'): string {
  if (!iso) return ''
  return baseFmtDate(iso, style === 'long' ? LONG_DATE_OPTS : SHORT_DATE_OPTS)
}

// ── Property display helpers ──────────────────────────────────────────────────

/** Returns the marketing/display title, falling back to EspoCRM's internal name. */
export function getDisplayName(property: Pick<RealEstateProperty, 'title' | 'name'>): string {
  return property.title || property.name
}

/**
 * Returns a human-readable location string.
 * Format: "City • District" when both present, otherwise whichever is available.
 */
export function getDisplayLocation(
  property: Pick<RealEstateProperty, 'addressCity' | 'locationName'>,
): string {
  const city     = property.addressCity?.trim()
  const district = property.locationName?.trim()
  if (city && district) return `${city} • ${district}`
  return city || district || ''
}

/** Returns true when at least one physical spec (beds/baths/area) is present. */
export function hasSpecs(
  property: Pick<RealEstateProperty, 'bedroomCount' | 'bathroomCount' | 'square'>,
): boolean {
  return (
    property.bedroomCount  != null ||
    property.bathroomCount != null ||
    property.square        != null
  )
}

/** Returns true when at least one listing quality indicator is active. */
export function hasIndicators(
  property: Pick<RealEstateProperty, 'isFeatured' | 'isVerified' | 'isPremium' | 'isNewListing'>,
): boolean {
  return !!(property.isFeatured || property.isVerified || property.isPremium || property.isNewListing)
}
