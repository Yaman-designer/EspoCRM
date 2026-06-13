/**
 * Shared display utilities for the properties feature.
 * All Intl formatters are module-level constants — creating them once avoids
 * the overhead of constructor calls on every render.
 */

import type { RealEstateProperty } from '../types/property.types'

// ── Price formatting ──────────────────────────────────────────────────────────

const PRICE_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

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
  return PRICE_FMT.format(price)
}

// ── Date formatting ───────────────────────────────────────────────────────────

const DATE_FMT_SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const DATE_FMT_LONG = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function fmtDate(iso: string | undefined, style: 'short' | 'long' = 'short'): string {
  if (!iso) return ''
  const d = new Date(iso)
  return style === 'long' ? DATE_FMT_LONG.format(d) : DATE_FMT_SHORT.format(d)
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
    property.bedroomCount !== undefined ||
    property.bathroomCount !== undefined ||
    property.square !== undefined
  )
}

/** Returns true when at least one listing quality indicator is active. */
export function hasIndicators(
  property: Pick<RealEstateProperty, 'isFeatured' | 'isVerified' | 'isPremium' | 'isNewListing'>,
): boolean {
  return !!(property.isFeatured || property.isVerified || property.isPremium || property.isNewListing)
}
