import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Server-to-server proxy: forwards authenticated requests to EspoCRM.
// The EspoCRM URL and auth token never reach the browser.

const ESPO_BASE = process.env.ESPO_API_URL

if (!ESPO_BASE) {
  throw new Error('ESPO_API_URL environment variable is not set.')
}

type RouteContext = { params: Promise<{ path: string[] }> }

async function proxyRequest(req: NextRequest, method: string, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth()

  if (!session?.espoToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await ctx.params
  const espoPath = path.join('/')

  // Forward all query parameters from the original request
  const targetUrl = new URL(`${ESPO_BASE}/${espoPath}`)
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Espo-Authorization': session.espoToken,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  }

  if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
    const body = await req.text()
    if (body) fetchOptions.body = body
  }

  try {
    const espoRes = await fetch(targetUrl.toString(), fetchOptions)

    // Pass through the status; parse JSON or return empty body for 204/DELETE
    if (espoRes.status === 204 || espoRes.headers.get('content-length') === '0') {
      return new NextResponse(null, { status: espoRes.status })
    }

    const contentType = espoRes.headers.get('content-type') ?? ''
    const text = await espoRes.text()

    if (!text.trim()) {
      return new NextResponse(null, { status: espoRes.status })
    }

    if (contentType.includes('application/json')) {
      const data: unknown = JSON.parse(text)
      return NextResponse.json(data, { status: espoRes.status })
    }

    return new NextResponse(text, {
      status: espoRes.status,
      headers: { 'Content-Type': contentType },
    })
  } catch {
    return NextResponse.json({ error: 'Gateway error' }, { status: 502 })
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, 'GET', ctx)
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, 'POST', ctx)
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, 'PATCH', ctx)
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, 'PUT', ctx)
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxyRequest(req, 'DELETE', ctx)
}
