import type { NearbyPlace, PlaceCategory, GeocodeResult } from '../hooks/usePropertyLocation'
import type { RealEstateProperty } from '../types/property.types'
import { isMeaningfulAddressFragment, type Row } from '@/shared/detail-view'

// ── Nearby-place category counts ────────────────────────────────────────────
// Enterprise architecture pass (2026-07-23). This file used to also own
// `TAB_CONFIG` (tab labels, lucide icons, and the category→tab mapping) and
// build the final tab list itself — that's presentation configuration (a
// UI-library binding + editorial copy), not data, so it now lives in
// LocationIntelligenceCenter.tsx. This ViewModel's job is just: given the
// real fetched places, how many fall in each category. The component
// combines that with its own local tab config.

export type LocationTab = 'education' | 'medical' | 'transit' | 'walk'

const ALL_CATEGORIES: PlaceCategory[] = ['school', 'hospital', 'metro', 'restaurant', 'shopping']

// Matches fetchNearbyPlaces()'s own default radiusM in geocoding.service.ts
// — the real area the Overpass query covers, drawn on the map as-is rather
// than a separately-invented per-category radius.
export const SEARCH_RADIUS_M = 2000

export function countNearbyByCategory(nearby: NearbyPlace[]): Record<PlaceCategory, number> {
  const counts = {} as Record<PlaceCategory, number>
  for (const cat of ALL_CATEGORIES) counts[cat] = nearby.filter(p => p.category === cat).length
  return counts
}

/** Selected tab if it's still in the available list, else the first available tab, else none. */
export function resolveActiveTab(availableTabIds: string[], selectedTab: string | null): string | null {
  return (selectedTab && availableTabIds.includes(selectedTab)) ? selectedTab : (availableTabIds[0] ?? null)
}

export function filterNearbyByCategories(nearby: NearbyPlace[], categories: PlaceCategory[]): NearbyPlace[] {
  return nearby.filter(p => categories.includes(p.category))
}

// ── Map coordinates ──────────────────────────────────────────────────────────

export interface MapCoords {
  latitude: number
  longitude: number
  isApproximate: boolean
}

// Data Authenticity Certification (Sprint 2). addressLatitude/
// addressLongitude are the property's own real, manually-entered exact
// coordinates — a different, more authoritative source than a geocoded
// result, which is an approximate match from geocoding a location NAME.
// Prefers the real value and only falls back to the approximate geocoded
// one, disclosed as such via `isApproximate`.
export function resolveMapCoords(
  property: Pick<RealEstateProperty, 'addressLatitude' | 'addressLongitude'>,
  geo: Pick<GeocodeResult, 'latitude' | 'longitude'> | null | undefined,
): MapCoords | null {
  const { addressLatitude, addressLongitude } = property
  if (addressLatitude != null && addressLongitude != null) {
    return { latitude: addressLatitude, longitude: addressLongitude, isApproximate: false }
  }
  if (geo) return { latitude: geo.latitude, longitude: geo.longitude, isApproximate: true }
  return null
}

// ── Address & Coordinates panel ─────────────────────────────────────────────

// `DistanceRow` stays distinct (numeric `value`, used with a "km" suffix at
// render time) — it isn't the same shape as the shared `Row` (string
// value). What used to be a separately-declared `FactRow` here was
// structurally identical to `Row`, so it's collapsed into it directly
// (enterprise architecture pass, 2026-07-23: type consistency).
export interface DistanceRow { labelKey: string; value: number }

export interface AddressCoordinatesViewModel {
  addressLine: string | null
  hasCoords: boolean
  latitude?: number
  longitude?: number
  geocodeType?: string
  distances: DistanceRow[]
  facts: Row[]
  isEmpty: boolean
}

/**
 * Shapes AddressCoordinatesPanel's address line, distances, and zoning/view
 * facts — field selection, the "at least 2 real characters" address-garbage
 * filter, and the distances/facts row-building all used to live inline in
 * the component.
 */
export function buildAddressCoordinatesViewModel(property: RealEstateProperty): AddressCoordinatesViewModel {
  const {
    addressStreet, addressCity, addressState, addressPostalCode, addressCountry,
    addressLatitude, addressLongitude, addressGeocodeType,
    belt, view, withinCityPlan, closeTo,
    distanceFromSea, distanceFromCity, distanceFromVillage, distanceFromAirport,
  } = property

  const addressParts = [addressStreet, addressCity, addressState, addressPostalCode, addressCountry]
    .filter(isMeaningfulAddressFragment)
  const hasCoords = addressLatitude != null && addressLongitude != null

  const distances = ([
    { labelKey: 'location.addressCoordinates.distanceRows.fromSea',     value: distanceFromSea },
    { labelKey: 'location.addressCoordinates.distanceRows.fromCity',    value: distanceFromCity },
    { labelKey: 'location.addressCoordinates.distanceRows.fromVillage', value: distanceFromVillage },
    { labelKey: 'location.addressCoordinates.distanceRows.fromAirport', value: distanceFromAirport },
  ] as Array<{ labelKey: string; value?: number }>).filter((d): d is DistanceRow => d.value != null)

  const facts = ([
    { labelKey: 'location.addressCoordinates.factRows.zoningBelt',      value: belt },
    { labelKey: 'location.addressCoordinates.factRows.view',             value: view },
    { labelKey: 'location.addressCoordinates.factRows.closeTo',         value: closeTo },
    { labelKey: 'location.addressCoordinates.factRows.withinCityPlan', value: withinCityPlan == null ? undefined : (withinCityPlan ? 'Yes' : 'No') },
  ] as Array<{ labelKey: string; value?: string | null }>).filter((f): f is Row => !!f.value)

  return {
    addressLine: addressParts.length > 0 ? addressParts.join(', ') : null,
    hasCoords,
    latitude: addressLatitude ?? undefined,
    longitude: addressLongitude ?? undefined,
    geocodeType: addressGeocodeType ?? undefined,
    distances,
    facts,
    isEmpty: addressParts.length === 0 && !hasCoords && distances.length === 0 && facts.length === 0,
  }
}
