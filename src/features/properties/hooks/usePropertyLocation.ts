'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import type { GeocodeResult, NearbyPlace, PlaceCategory } from '../services/geocoding.service'
import { fetchLocationById } from '../repositories/real-estate-location.repository'

// ── Types ─────────────────────────────────────────────────────────────────────

export type { GeocodeResult, NearbyPlace, PlaceCategory }

export interface LocationInput {
  locationName?:         string
  subRegionLocationName?: string
  regionLocationName?:   string
  // Property Details Sprint 1 — Runtime Completion. Final fallback level,
  // tried after the location-hierarchy names — see geocodeLocationProgressive.
  addressCity?:          string
}

// ── Geocoding query builder ───────────────────────────────────────────────────
// Kept for any external caller that wants the old single combined string
// (e.g. cache-key display/debugging) — no longer used to drive the actual
// geocode lookup below, which now tries each level independently.

const COUNTRY_HINT = process.env.NEXT_PUBLIC_GEOCODING_COUNTRY ?? 'Greece'

export function buildGeoQuery(loc: LocationInput): string {
  return [
    loc.locationName,
    loc.subRegionLocationName,
    loc.regionLocationName,
    COUNTRY_HINT,
  ]
    .filter(Boolean)
    .join(', ')
}

// ── usePropertyLocation ───────────────────────────────────────────────────────
// Property Details Sprint 1 — Runtime Completion (root cause fix). Previously
// built one combined query string and geocoded it as a single lookup —
// live-tested this session: EspoCRM's locationName/regionLocationName are
// frequently internal micro-area/zone labels Nominatim doesn't recognize,
// and concatenating them with a real, geocodable sub-region name into one
// string made the whole lookup fail even though the real name alone would
// have succeeded. Now tries each level independently via
// geocodeLocationProgressive, most specific first, returning the first real
// match — this is why the map was permanently showing the static fallback.

// Location Intelligence Runtime Certification (2026-07-18). Root cause fix:
// this hook previously called geocodeLocationProgressive() directly, which
// fetches nominatim.openstreetmap.org straight from the browser. Neither
// Nominatim nor Overpass send an Access-Control-Allow-Origin header
// (confirmed live), so every browser silently blocks that response from
// reaching JavaScript — the fetch throws, geocodeLocation()'s
// `.catch(() => null)` turns that into a clean `null`, and the map falls
// back to MapSimulator regardless of how good the location data is. Now
// routes through this app's own /api/geocode, which performs the exact
// same geocodeLocationProgressive() call server-side, where CORS doesn't
// apply at all.
export function usePropertyLocation(location: LocationInput) {
  const hasFields = !!(
    location.locationName ||
    location.subRegionLocationName ||
    location.regionLocationName ||
    location.addressCity
  )

  return useQuery<GeocodeResult | null>({
    queryKey: [
      'geocode',
      location.locationName,
      location.subRegionLocationName,
      location.regionLocationName,
      location.addressCity,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (location.locationName)          params.set('locationName', location.locationName)
      if (location.subRegionLocationName) params.set('subRegionLocationName', location.subRegionLocationName)
      if (location.regionLocationName)    params.set('regionLocationName', location.regionLocationName)
      if (location.addressCity)           params.set('addressCity', location.addressCity)

      const res = await fetch(`/api/geocode?${params.toString()}`)
      if (!res.ok) return null
      return res.json() as Promise<GeocodeResult | null>
    },
    enabled:   hasFields,
    staleTime: 24 * 60 * 60 * 1000,  // geocoding results rarely change
    gcTime:    48 * 60 * 60 * 1000,
    retry:     1,
  })
}

// ── useLocationCascadeNames ───────────────────────────────────────────────────
// Resolves the wizard's Region/Sub-Region/Location cascade (regionLocationId/
// subRegionLocationId/locationId — the real belongsTo relationship ids) back
// to display names, since the geocoder needs text, not ids. Feeds directly
// into usePropertyLocation's LocationInput shape.

export function useLocationCascadeNames(ids: {
  regionLocationId?: string
  subRegionLocationId?: string
  locationId?: string
}): LocationInput {
  const results = useQueries({
    queries: [
      { queryKey: ['realEstateLocation', ids.regionLocationId], queryFn: () => fetchLocationById(ids.regionLocationId!), enabled: !!ids.regionLocationId, staleTime: 10 * 60 * 1000 },
      { queryKey: ['realEstateLocation', ids.subRegionLocationId], queryFn: () => fetchLocationById(ids.subRegionLocationId!), enabled: !!ids.subRegionLocationId, staleTime: 10 * 60 * 1000 },
      { queryKey: ['realEstateLocation', ids.locationId], queryFn: () => fetchLocationById(ids.locationId!), enabled: !!ids.locationId, staleTime: 10 * 60 * 1000 },
    ],
  })
  const [region, subRegion, location] = results

  return {
    regionLocationName: region.data?.name,
    subRegionLocationName: subRegion.data?.name,
    locationName: location.data?.name,
  }
}

// ── useNearbyPlaces ───────────────────────────────────────────────────────────
// Location Intelligence Runtime Certification (2026-07-18). Same CORS root
// cause as usePropertyLocation above — overpass-api.de also sends no
// Access-Control-Allow-Origin, which is why the Restaurants/Transit/Schools
// stats always showed "—" (useNearbyPlaces' data silently stayed empty).
// Now routes through /api/nearby-places, server-side, no CORS involved.

export function useNearbyPlaces(latitude: number | null, longitude: number | null) {
  return useQuery<NearbyPlace[]>({
    queryKey: ['nearby-places', latitude?.toFixed(3), longitude?.toFixed(3)],
    queryFn: async () => {
      const res = await fetch(`/api/nearby-places?lat=${latitude}&lon=${longitude}`)
      if (!res.ok) return []
      return res.json() as Promise<NearbyPlace[]>
    },
    enabled:   latitude != null && longitude != null,
    staleTime: 60 * 60 * 1000,       // nearby places change rarely
    gcTime:    4 * 60 * 60 * 1000,
    retry:     1,
  })
}
