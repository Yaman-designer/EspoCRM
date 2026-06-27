'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  geocodeLocation,
  fetchNearbyPlaces,
  type GeocodeResult,
  type NearbyPlace,
  type PlaceCategory,
} from '../services/geocoding.service'

// ── Types ─────────────────────────────────────────────────────────────────────

export type { GeocodeResult, NearbyPlace, PlaceCategory }

export interface LocationInput {
  locationName?:         string
  subRegionLocationName?: string
  regionLocationName?:   string
}

// ── Geocoding query builder ───────────────────────────────────────────────────

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

export function usePropertyLocation(location: LocationInput) {
  const query = useMemo(() => buildGeoQuery(location), [
    location.locationName,
    location.subRegionLocationName,
    location.regionLocationName,
  ])

  const hasFields = !!(
    location.locationName ||
    location.subRegionLocationName ||
    location.regionLocationName
  )

  return useQuery<GeocodeResult | null>({
    queryKey:  ['geocode', query],
    queryFn:   () => geocodeLocation(query),
    enabled:   hasFields,
    staleTime: 24 * 60 * 60 * 1000,  // geocoding results rarely change
    gcTime:    48 * 60 * 60 * 1000,
    retry:     1,
  })
}

// ── useNearbyPlaces ───────────────────────────────────────────────────────────

export function useNearbyPlaces(latitude: number | null, longitude: number | null) {
  return useQuery<NearbyPlace[]>({
    queryKey:  ['nearby-places', latitude?.toFixed(3), longitude?.toFixed(3)],
    queryFn:   () => fetchNearbyPlaces(latitude!, longitude!),
    enabled:   latitude != null && longitude != null,
    staleTime: 60 * 60 * 1000,       // nearby places change rarely
    gcTime:    4 * 60 * 60 * 1000,
    retry:     1,
  })
}
