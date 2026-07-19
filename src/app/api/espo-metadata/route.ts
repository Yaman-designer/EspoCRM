import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'

// Fetches RealEstateProperty field metadata from EspoCRM, including live
// `status` and `type` field options — the canonical source both are meant to
// be read from (see property-type.registry.ts and domain/constants.ts).

// ── Fallback-only property type list ─────────────────────────────────────────
// Used only if EspoCRM's Metadata response is unreachable or lacks type.options
// (see the try/catch below). Not the primary source — do not treat edits here
// as changing what EspoCRM actually returns.
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

    // EspoCRM metadata shape: { entityDefs: { RealEstateProperty: { fields: { status: { options: [...] } } } } }
    // Confirmed live 2026-07-14 (Requirements Certification Stage A, re-verified
    // at Wave 1) — the scope is nested under `entityDefs`, not top-level. The
    // previous `metadata?.RealEstateProperty` lookup always resolved to the `{}`
    // fallback, so this route has never returned real data since it was written.
    const entityDefs  = (metadata?.entityDefs ?? {})        as Record<string, unknown>
    const scope       = (entityDefs?.RealEstateProperty ?? {}) as Record<string, unknown>
    const fields      = (scope?.fields ?? {})               as Record<string, unknown>
    const statusField = (fields?.status ?? {})              as Record<string, unknown>
    const typeField   = (fields?.type ?? {})                as Record<string, unknown>

    const statusOptions: string[] = Array.isArray(statusField?.options) ? statusField.options as string[] : []

    // typeOptions: live from EspoCRM's own field metadata, same as status above.
    // Falls back to the local list only if EspoCRM's response lacks type.options.
    const liveTypeOptions: string[] = Array.isArray(typeField?.options) ? typeField.options as string[] : []
    const typeOptions = liveTypeOptions.length > 0 ? liveTypeOptions : [...PROPERTY_TYPE_OPTIONS]

    return NextResponse.json({ statusOptions, typeOptions })
  } catch {
    return NextResponse.json({ statusOptions: [], typeOptions: [...PROPERTY_TYPE_OPTIONS] })
  }
}
