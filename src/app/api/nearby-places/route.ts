import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchNearbyPlaces } from '@/features/properties/services/geocoding.service'

// Location Intelligence Runtime Certification (2026-07-18). Same CORS root
// cause as /api/geocode — overpass-api.de sends no Access-Control-Allow-
// Origin header, so the direct client-side fetch in fetchNearbyPlaces()
// always failed in the browser (even though it succeeds from any
// server/curl context, which is why prior verification passes never caught
// this). This is why the Restaurants/Transit/Schools stats always showed
// "—" (useNearbyPlaces' data silently stayed empty on every real page
// load) — not a data problem, a network-layer one.

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.espoToken) {
    return NextResponse.json([], { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const lat = Number.parseFloat(params.get('lat') ?? '')
  const lon = Number.parseFloat(params.get('lon') ?? '')

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json([], { status: 400 })
  }

  try {
    const places = await fetchNearbyPlaces(lat, lon)
    return NextResponse.json(places)
  } catch {
    return NextResponse.json([])
  }
}
