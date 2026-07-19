import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { geocodeLocationProgressive } from '@/features/properties/services/geocoding.service'

// Location Intelligence Runtime Certification (2026-07-18). Root cause:
// geocodeLocationProgressive() and its underlying Nominatim/Overpass calls
// were being invoked directly from client-side hooks (usePropertyLocation.ts,
// 'use client'). Neither nominatim.openstreetmap.org nor overpass-api.de
// return an Access-Control-Allow-Origin header (confirmed live, this
// session) — every browser therefore blocks the response from reaching
// JavaScript, the fetch rejects, geocodeLocation()'s `.catch(() => null)`
// converts that into a clean `null`, and LocationIntelligenceCenter's
// mapCoords stays null for any property without manually-entered
// addressLatitude/addressLongitude (the large majority of the dataset) —
// which is exactly the MapSimulator fallback being reported. Server-to-
// server fetches are not subject to CORS at all, so moving this call behind
// the app's own API route (this file) removes the failure mode entirely,
// with zero change to the Location Intelligence Center component itself.

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.espoToken) {
    return NextResponse.json(null, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const locationName          = params.get('locationName')          ?? undefined
  const subRegionLocationName = params.get('subRegionLocationName') ?? undefined
  const regionLocationName    = params.get('regionLocationName')    ?? undefined
  const addressCity           = params.get('addressCity')           ?? undefined

  if (!locationName && !subRegionLocationName && !regionLocationName && !addressCity) {
    return NextResponse.json(null)
  }

  const result = await geocodeLocationProgressive({
    locationName, subRegionLocationName, regionLocationName, addressCity,
  })

  return NextResponse.json(result)
}
