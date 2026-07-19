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

// Address Business Group, Phase 3 (Maps & Places). Parsed into the exact
// canonical field names the Address Business Group's Phase 2 shipped
// (addressStreet/addressCity/addressState/addressPostalCode/addressCountry)
// — never cLocationReal*, consistent with Phase 2's resolved
// canonicalization decision. Fields are optional because Nominatim's own
// address breakdown is itself incomplete for many results (e.g. a village
// with no house_number) — never invented when the source doesn't have it.
export interface AddressSuggestion {
  formattedAddress: string
  street?:          string
  city?:            string
  state?:           string
  postalCode?:      string
  country?:         string
  latitude:         number
  longitude:        number
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

// ── External map links ────────────────────────────────────────────────────────
// Interactive Map Experience phase. Priority for "best available location":
// exact/stored coordinates → geocoded coordinates → address text → location
// hierarchy text. Callers resolve the coordinate half of that chain
// themselves (LocationIntelligenceCenter's `mapCoords` already prefers real
// addressLatitude/Longitude over a geocoded match) — these builders take
// whatever coordinate that produced and extend the chain down to text
// search only when no coordinate exists at all (e.g. the MapSimulator
// fallback), so a link is still offered even with zero coordinates.

export interface MapsLinkInput {
  latitude?:     number | null
  longitude?:    number | null
  addressText?:  string | null
  locationText?: string | null
  label?:        string
}

function bestLocationQuery(input: MapsLinkInput): string | null {
  if (input.latitude != null && input.longitude != null) {
    return `${input.latitude},${input.longitude}`
  }
  return input.addressText?.trim() || input.locationText?.trim() || null
}

export function buildGoogleMapsUrl(input: MapsLinkInput): string | null {
  const query = bestLocationQuery(input)
  if (!query) return null
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}`
}

export function buildGoogleDirectionsUrl(input: MapsLinkInput): string | null {
  const destination = bestLocationQuery(input)
  if (!destination) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export function buildAppleMapsUrl(input: MapsLinkInput): string | null {
  if (input.latitude != null && input.longitude != null) {
    const label = input.label ? `&q=${encodeURIComponent(input.label)}` : ''
    return `https://maps.apple.com/?ll=${input.latitude},${input.longitude}${label}`
  }
  const query = input.addressText?.trim() || input.locationText?.trim()
  return query ? `https://maps.apple.com/?q=${encodeURIComponent(query)}` : null
}

// Apple Maps is only the natural "open in native app" choice on Apple's own
// platforms — everywhere else Google Maps is the universal, always-works
// default, so Apple Maps is offered as an addition there, never a
// replacement.
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent || navigator.platform || '')
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

  // Location Intelligence Runtime Certification (2026-07-18). Live-tested
  // this session: appending the country hint as free text (e.g. "Άγιοι
  // Ανάργυροι, Greece") to a Greek-script candidate can make Nominatim's
  // ranking collapse onto the country's own administrative boundary —
  // technically a non-null, HTTP 200 result, but one with zero location
  // precision (the pin would land on the geographic center of Greece, not
  // the property's neighborhood). geocodeLocationProgressive takes the
  // first non-null result and stops, so an unfiltered country-level "match"
  // silently blocks every better candidate later in the fallback chain
  // (subRegion → region → addressCity) from ever being tried. Treating a
  // country-level match as "no match" lets the chain correctly fall
  // through instead.
  if (data[0].addresstype === 'country') return null

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

// ── Public API: geocodeLocationProgressive ────────────────────────────────────
// Property Details Sprint 1 — Runtime Completion. Root cause fix for the
// Location map permanently falling back to the static simulator: the
// previous single-query approach (usePropertyLocation.ts's buildGeoQuery)
// joined every level of EspoCRM's location hierarchy into one string —
// `${locationName}, ${subRegionLocationName}, ${regionLocationName}, ${country}`.
// locationName and regionLocationName are frequently internal micro-area/zone
// labels (e.g. "Ανατολικά Λεωφόρου Ανθούσας", "Αθήνα - Ανατολικά Προάστια")
// that aren't indexed by Nominatim at all — live-tested this session: the
// combined query returns 0 results even when a substring of it (the
// sub-region name alone) returns a real match. Structured, single-string
// concatenation fails as a whole when any component is unrecognized; this
// tries each level independently, most specific first, and returns the
// first real match instead of giving up after one combined attempt.

export interface ProgressiveLocationInput {
  locationName?:          string
  subRegionLocationName?: string
  regionLocationName?:    string
  addressCity?:           string
}

const COUNTRY_HINT = process.env.NEXT_PUBLIC_GEOCODING_COUNTRY ?? 'Greece'

export async function geocodeLocationProgressive(
  input: ProgressiveLocationInput,
): Promise<GeocodeResult | null> {
  const candidates = [
    input.locationName,
    input.subRegionLocationName,
    input.regionLocationName,
    input.addressCity,
  ]
    .map(v => v?.trim())
    .filter((v): v is string => !!v)

  for (const candidate of candidates) {
    const result = await geocodeLocation(`${candidate}, ${COUNTRY_HINT}`)
    if (result) return result
  }

  return null
}

// ── Public API: searchAddresses ─────────────────────────────────────────────
// Address Business Group, Phase 3. Nominatim-only, deliberately — this is a
// different feature from geocodeLocation() above (multi-result, address-
// component search, not a single best-guess coordinate lookup), so the
// Google-if-key-present branch above isn't reused here; extending it would
// mean adding Google Places Autocomplete, a distinct paid product from
// Google's Geocoding API this file already conditionally supports. See the
// Phase 3 Architecture Proposal for the full comparison. Not cached — a
// live, per-keystroke (debounced by the caller) search is expected to
// change on every character, unlike geocodeLocation's stable location names.

const addressSearchCache = new Map<string, AddressSuggestion[]>()

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []

  if (addressSearchCache.has(q)) return addressSearchCache.get(q)!

  // accept-language=en: Nominatim otherwise returns components in the
  // location's own local language (confirmed live — Greek results for
  // Greek addresses), inconsistent with the rest of this English-language
  // wizard. Search terms themselves are unaffected — a Greek-typed query
  // still matches normally, only the returned labels are normalized.
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&accept-language=en`
  let results: AddressSuggestion[] = []
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EblaCRM/1.0 (realtorvoice.gr)' },
      signal:  AbortSignal.timeout(8_000),
    })
    if (res.ok) {
      const data = await res.json() as Array<{
        display_name: string
        lat: string
        lon: string
        address?: Record<string, string>
      }>
      results = data.map(item => {
        const a = item.address ?? {}
        const street = [a.house_number, a.road].filter(Boolean).join(' ') || undefined
        return {
          formattedAddress: item.display_name,
          street,
          city: a.city ?? a.town ?? a.village ?? a.municipality ?? undefined,
          state: a.state ?? undefined,
          postalCode: a.postcode ?? undefined,
          country: a.country ?? undefined,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }
      })
    }
  } catch { /* network error / timeout — return whatever we have (empty) */ }

  addressSearchCache.set(q, results)
  return results
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
