import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// ESPO_API_URL = "https://host/api/v1" — WebAsset lives at the CRM root, not
// under /api/v1, so we derive the origin and construct the entry-point URL.
const ESPO_API_URL = process.env.ESPO_API_URL
if (!ESPO_API_URL) throw new Error('ESPO_API_URL environment variable is not set.')

// For subdirectory installs set ESPO_ROOT_URL explicitly; standard installs
// use the origin of ESPO_API_URL (e.g. "https://espo.example.com/api/v1" → "https://espo.example.com").
const ESPO_ROOT = process.env.ESPO_ROOT_URL ?? new URL(ESPO_API_URL).origin

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.espoToken) {
    return new NextResponse(null, { status: 401 })
  }

  const id   = req.nextUrl.searchParams.get('id')
  const size = req.nextUrl.searchParams.get('size') ?? 'medium'

  if (!id) {
    return new NextResponse(null, { status: 400 })
  }

  const assetUrl =
    `${ESPO_ROOT}/?entryPoint=WebAsset` +
    `&id=${encodeURIComponent(id)}` +
    `&size=${encodeURIComponent(size)}`

  try {
    const upstream = await fetch(assetUrl, {
      headers: { 'Espo-Authorization': session.espoToken },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Allow Next.js image optimizer + CDN to cache for 1 day.
        // next.config minimumCacheTTL handles the /_next/image layer (7 days).
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
