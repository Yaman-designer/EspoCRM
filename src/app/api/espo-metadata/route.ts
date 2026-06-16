import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'

// Fetches RealEstateProperty field metadata from EspoCRM and merges it with
// locally configured overrides. Type options are defined here rather than in
// EspoCRM field config so they can be updated without an EspoCRM admin deploy.

// ── Canonical property type list ─────────────────────────────────────────────
// Update this array to change what appears in the Type filter and create form.
// Also update EspoCRM admin → Entity Manager → RealEstateProperty → type field
// options to keep the detail view's dropdown in sync.
const PROPERTY_TYPE_OPTIONS = [
  'Apartment',
  'Detached',
  'Maisonette',
  'Plot',
  'Studio',
  'Store',
] as const

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

    if (!res.ok) return NextResponse.json({ statusOptions: [], typeOptions: [...PROPERTY_TYPE_OPTIONS] })

    const metadata: Record<string, unknown> = await res.json()

    // EspoCRM metadata shape: { RealEstateProperty: { fields: { status: { options: [...] } } } }
    const scope       = (metadata?.RealEstateProperty ?? {}) as Record<string, unknown>
    const fields      = (scope?.fields ?? {})               as Record<string, unknown>
    const statusField = (fields?.status ?? {})              as Record<string, unknown>

    const statusOptions: string[] = Array.isArray(statusField?.options) ? statusField.options as string[] : []

    // typeOptions: always use the locally configured list, not EspoCRM's field options.
    return NextResponse.json({ statusOptions, typeOptions: [...PROPERTY_TYPE_OPTIONS] })
  } catch {
    return NextResponse.json({ statusOptions: [], typeOptions: [...PROPERTY_TYPE_OPTIONS] })
  }
}
