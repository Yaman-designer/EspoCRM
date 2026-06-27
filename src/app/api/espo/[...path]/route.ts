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
  const session  = await auth()
  const { path } = await ctx.params
  const espoPath = path.join('/')

  // ── 1. Log every inbound request ──────────────────────────────────────────
  const userId   = (session as { user?: { id?: string } } | null)?.user?.id ?? '(no session)'
  const hasToken = !!session?.espoToken
  // Decode btoa(username:token) to show which EspoCRM user the token belongs to
  const tokenUser = hasToken
    ? Buffer.from(session!.espoToken, 'base64').toString().split(':')[0]
    : null

  console.log(
    `[espo-proxy] ▶ ${method} /${espoPath}` +
    `  | session-user: ${userId}` +
    `  | espoToken: ${hasToken ? `present (decoded user: "${tokenUser}")` : 'MISSING'}`,
  )

  // ── 2. Guard: no session token → 401 from Next.js proxy (not EspoCRM) ─────
  if (!session?.espoToken) {
    console.error(`[espo-proxy] ✗ 401 — origin: Next.js proxy — no session token`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 3. Build and log outbound EspoCRM URL ─────────────────────────────────
  const targetUrl = new URL(`${ESPO_BASE}/${espoPath}`)
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  console.log(`[espo-proxy] ↗ outbound: ${method} ${targetUrl.toString()}`)

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

  // ── 4. Call EspoCRM — always read body before any branching ───────────────
  // IMPORTANT: the body must be read here, before any early returns, so that
  // error logging is never bypassed by an empty content-length check.
  try {
    const espoRes = await fetch(targetUrl.toString(), fetchOptions)
    const status      = espoRes.status
    const contentType = espoRes.headers.get('content-type') ?? ''
    const clHeader    = espoRes.headers.get('content-length') ?? '(not sent)'
    const text        = await espoRes.text()   // safe on empty/204 bodies → returns ''

    // ── 5. Log EspoCRM response (always) ────────────────────────────────────
    console.log(
      `[espo-proxy] ← EspoCRM: HTTP ${status}` +
      `  | content-type: ${contentType || '(none)'}` +
      `  | content-length: ${clHeader}` +
      `  | body: ${text ? JSON.stringify(text.slice(0, 300)) : '(empty)'}`,
    )

    // ── 6. Additional error detail ───────────────────────────────────────────
    if (!espoRes.ok) {
      console.error(
        `[espo-proxy] ✗ ${status} — origin: EspoCRM — ${method} ${targetUrl.toString()}\n` +
        `  response body: ${text || '(empty)'}`,
      )
    }

    // ── 7. Return to browser ─────────────────────────────────────────────────
    if (!text.trim()) {
      return new NextResponse(null, { status })
    }

    if (contentType.includes('application/json')) {
      const data: unknown = JSON.parse(text)
      return NextResponse.json(data, { status })
    }

    return new NextResponse(text, {
      status,
      headers: { 'Content-Type': contentType },
    })
  } catch (err) {
    console.error(`[espo-proxy] ✗ Network/parse error — ${method} /${espoPath}: ${String(err)}`)
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
