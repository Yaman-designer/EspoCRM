import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ESPO_BASE = process.env.NEXT_PUBLIC_ESPO_API_URL!
const ENTITIES = ['Contact', 'RealEstateRequest', 'Account', 'EblaContractParty'] as const

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  const cookieStore = await cookies()
  const token = cookieStore.get('espo-token')?.value
  if (!token) return NextResponse.json([], { status: 401 })

  const headers = {
    'Content-Type': 'application/json',
    'Espo-Authorization': token,
  }

  const requests = ENTITIES.map(async (entity) => {
    try {
      const url = new URL(`${ESPO_BASE}/${entity}`)
      url.searchParams.set('maxSize', '5')
      url.searchParams.set('offset', '0')
      // Use where[] format — most compatible across EspoCRM versions
      url.searchParams.set('where[0][type]', 'textFilter')
      url.searchParams.set('where[0][value]', q)

      const res = await fetch(url.toString(), { headers, cache: 'no-store' })
      if (!res.ok) return []

      const data = await res.json()
      return (data.list ?? []).map((item: { id: string; name?: string }) => ({
        id: item.id,
        name: item.name ?? item.id,
        entityType: entity,
      }))
    } catch {
      return []
    }
  })

  const results = await Promise.all(requests)
  return NextResponse.json(results.flat())
}
