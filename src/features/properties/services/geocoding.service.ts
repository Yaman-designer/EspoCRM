/**
 * Geocoding service — converts location name strings into lat/lng coordinates.
 *
 * Priority:
 *   1. Google Geocoding API  (if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set)
 *   2. OpenStreetMap Nominatim (always available, no key required)
 *
 * Results are cached in memory for the lifetime of the browser session to avoid
 * redundant network requests when navigating between property detail pages.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeocodeResult {
  latitude:         number
  longitude:        number
  formattedAddress: string
}

export type PlaceCategory =
  | 'school'
  | 'hospital'
  | 'shopping'
  | 'restaurant'
  | 'metro'

export interface NearbyPlace {
  id:       string
  name:     string
  category: PlaceCategory
  distance: number        // km
  lat:      number
  lon:      number
}

// ── Module-level cache ────────────────────────────────────────────────────────
// Keyed by the query string. Stores null for known-bad queries so we don't
// retry failed lookups on every render.

const geocodeCache = new Map<string, GeocodeResult | null>()
const nearbyCache  = new Map<string, NearbyPlace[]>()

// ── Haversine distance ────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Travel-time helpers ───────────────────────────────────────────────────────

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function formatTravelTime(km: number): string {
  if (km < 1) {
    const walkMin = Math.max(1, Math.round((km / 5) * 60))
    return `${walkMin} min walk`
  }
  const driveMin = Math.max(1, Math.round((km / 30) * 60))
  return `${driveMin} min drive`
}

// ── Google Geocoding ──────────────────────────────────────────────────────────

async function googleGeocode(query: string, apiKey: string): Promise<GeocodeResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
  const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) })
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.[0]) return null

  const result = data.results[0]
  return {
    latitude:         result.geometry.location.lat,
    longitude:        result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  }
}

// ── Nominatim Geocoding ───────────────────────────────────────────────────────

async function nominatimGeocode(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'EblaCRM/1.0 (realtorvoice.gr)' },
    signal:  AbortSignal.timeout(10_000),
  })
  if (!res.ok) return null

  const data = await res.json()
  if (!data[0]) return null

  return {
    latitude:         parseFloat(data[0].lat),
    longitude:        parseFloat(data[0].lon),
    formattedAddress: data[0].display_name,
  }
}

// ── Public API: geocodeLocation ───────────────────────────────────────────────

/**
 * Geocodes a location query string.
 * Returns null if both providers fail or the query is empty.
 */
export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const q = query.trim()
  if (!q) return null

  if (geocodeCache.has(q)) return geocodeCache.get(q)!

  let result: GeocodeResult | null = null

  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleKey) {
    result = await googleGeocode(q, googleKey).catch(() => null)
  }

  if (!result) {
    result = await nominatimGeocode(q).catch(() => null)
  }

  geocodeCache.set(q, result)
  return result
}

// ── Overpass nearby places ────────────────────────────────────────────────────

type OverpassElement = {
  id:   number
  lat:  number
  lon:  number
  tags: Record<string, string>
}

function resolveCategory(tags: Record<string, string>): PlaceCategory | null {
  const amenity = tags.amenity
  const shop    = tags.shop
  const railway = tags.railway
  const pt      = tags.public_transport

  if (amenity === 'school' || amenity === 'university' || amenity === 'college' || amenity === 'kindergarten')
    return 'school'
  if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'pharmacy' || amenity === 'doctors')
    return 'hospital'
  if (amenity === 'restaurant' || amenity === 'cafe' || amenity === 'fast_food' || amenity === 'bar')
    return 'restaurant'
  if (shop === 'mall' || shop === 'supermarket' || shop === 'department_store' || shop === 'convenience')
    return 'shopping'
  if (railway === 'subway_entrance' || railway === 'station' || railway === 'tram_stop' || pt === 'station')
    return 'metro'

  return null
}

/**
 * Fetches nearby points of interest using the Overpass API (OpenStreetMap).
 * Results are cached per coordinate pair (rounded to ~111m precision).
 */
export async function fetchNearbyPlaces(lat: number, lon: number, radiusM = 2000): Promise<NearbyPlace[]> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`
  if (nearbyCache.has(cacheKey)) return nearbyCache.get(cacheKey)!

  const query = [
    '[out:json][timeout:25];',
    '(',
    `node["amenity"~"^(school|university|college|hospital|clinic|pharmacy|restaurant|cafe|fast_food)"](around:${radiusM},${lat},${lon});`,
    `node["shop"~"^(mall|supermarket|department_store|convenience)"](around:${radiusM},${lat},${lon});`,
    `node["railway"~"^(subway_entrance|station|tram_stop)"](around:${radiusM},${lat},${lon});`,
    `node["public_transport"="station"](around:${radiusM},${lat},${lon});`,
    ');',
    'out body;',
  ].join('')

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
    signal:  AbortSignal.timeout(25_000),
  })

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`)

  const data = await res.json() as { elements: OverpassElement[] }

  // Deduplicate by name + category, keep closest
  const seen = new Map<string, NearbyPlace>()

  for (const el of data.elements) {
    if (!el.tags?.name) continue
    const category = resolveCategory(el.tags)
    if (!category) continue

    const distance = haversineKm(lat, lon, el.lat, el.lon)
    const dedupKey = `${category}:${el.tags.name.toLowerCase().slice(0, 30)}`

    const existing = seen.get(dedupKey)
    if (!existing || distance < existing.distance) {
      seen.set(dedupKey, {
        id:       String(el.id),
        name:     el.tags.name,
        category,
        distance,
        lat:      el.lat,
        lon:      el.lon,
      })
    }
  }

  const places = Array.from(seen.values()).sort((a, b) => a.distance - b.distance)
  nearbyCache.set(cacheKey, places)
  return places
}
