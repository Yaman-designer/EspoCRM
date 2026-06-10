import type { RealEstateProperty } from '@/features/properties/types/property.types'

type SlugSource = Pick<RealEstateProperty, 'id' | 'propertyCode'>

/**
 * Generates a URL-safe slug for a property.
 * Uses the propertyCode (lowercased) when available, falls back to the ID.
 * Example: "DVL68645" → "dvl68645", or just the UUID.
 */
export function propertySlug(property: SlugSource): string {
  return property.propertyCode?.toLowerCase() ?? property.id
}

/**
 * Returns the full path to the property detail page.
 * Example: "/properties/dvl68645"
 */
export function propertyPath(property: SlugSource): string {
  return `/properties/${propertySlug(property)}`
}
