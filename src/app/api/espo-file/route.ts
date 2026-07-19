import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Property Details Completion (2026-07-17). Same pattern as espo-image/
// route.ts, but for the Document entity's fileId (an Attachment record) via
// EspoCRM's generic `download` entry point rather than `WebAsset` — Document
// files aren't images and shouldn't go through the image-sized WebAsset path.
// Binary-safe (arrayBuffer, not text()) — the shared /api/espo/[...path]
// proxy reads responses as text and would corrupt non-JSON binary content.

const ESPO_API_URL = process.env.ESPO_API_URL
if (!ESPO_API_URL) throw new Error('ESPO_API_URL environment variable is not set.')

const ESPO_ROOT = process.env.ESPO_ROOT_URL ?? new URL(ESPO_API_URL).origin

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.espoToken) {
    return new NextResponse(null, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return new NextResponse(null, { status: 400 })
  }

  const fileUrl = `${ESPO_ROOT}/?entryPoint=download&id=${encodeURIComponent(id)}`

  try {
    const upstream = await fetch(fileUrl, {
      headers: { 'Espo-Authorization': session.espoToken },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType        = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const contentDisposition = upstream.headers.get('content-disposition')
    const buffer              = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
