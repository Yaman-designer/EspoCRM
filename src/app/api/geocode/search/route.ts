import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchAddresses } from '@/features/properties/services/geocoding.service'

// Production Certification Audit (2026-08-04). Same root cause and same fix
// as the sibling ../route.ts: AddressSearch.tsx called searchAddresses()
// (geocoding.service.ts) directly from the browser, fetching
// nominatim.openstreetmap.org client-side. Nominatim sends no
// Access-Control-Allow-Origin header, so every browser was already silently
// blocking the response via CORS before this app's CSP connect-src (which
// also doesn't list nominatim.openstreetmap.org) got a chance to — live-
// verified: every keystroke search returned zero results, indistinguishable
// from "no matches" in the UI. Server-to-server fetches aren't subject to
// CORS, so proxying through this route removes the failure mode entirely,
// with zero change to searchAddresses() itself.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.espoToken) {
    return NextResponse.json([], { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const results = await searchAddresses(q)

  return NextResponse.json(results)
}
