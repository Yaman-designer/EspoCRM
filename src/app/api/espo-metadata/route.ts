import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'

// Fetches RealEstateProperty field metadata from EspoCRM so the frontend
// can render dynamic filter options without hardcoding statuses or types.
// Cached for 5 minutes via Next.js route segment config.
export const revalidate = 300

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.espoToken) return NextResponse.json(null, { status: 401 })

  try {
    const res = await fetch(
      `${env.espoApiUrl}/Metadata?scopes[]=RealEstateProperty`,
      {
        headers: { 'Espo-Authorization': session.espoToken },
        cache: 'no-store',
      },
    )

    if (!res.ok) return NextResponse.json({ statusOptions: [], typeOptions: [] })

    const metadata: Record<string, unknown> = await res.json()

    // EspoCRM metadata shape: { RealEstateProperty: { fields: { status: { options: [...] } } } }
    const scope = (metadata?.RealEstateProperty ?? {}) as Record<string, unknown>
    const fields = (scope?.fields ?? {}) as Record<string, unknown>
    const statusField = (fields?.status ?? {}) as Record<string, unknown>
    const typeField   = (fields?.type   ?? {}) as Record<string, unknown>

    const statusOptions: string[] = Array.isArray(statusField?.options) ? statusField.options as string[] : []
    const typeOptions:   string[] = Array.isArray(typeField?.options)   ? typeField.options   as string[] : []

    return NextResponse.json({ statusOptions, typeOptions })
  } catch {
    return NextResponse.json({ statusOptions: [], typeOptions: [] })
  }
}
