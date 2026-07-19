import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import type { RealEstateProperty } from '@/features/properties/types/property.types'
import { PropertyFormPage } from '@/app/(dashboard)/properties/new/PropertyFormPage'
import { fetchPropertyBySlug } from '@/features/properties/repositories/property.repository.server'

// Base record fetch (propertyCode match, then direct id fallback) lives in
// property.repository.server.ts, shared with ../page.tsx (Architecture
// Debt Rank #8) — this function only owns the auth() call and this route's
// own relation enrichment (withDocuments below).

async function getProperty(slug: string): Promise<RealEstateProperty | null> {
  const session = await auth()
  if (!session?.espoToken) return null

  const headers: Record<string, string> = {
    'Espo-Authorization': session.espoToken,
  }

  const property = await fetchPropertyBySlug(slug, headers)
  return property ? withDocuments(property, headers) : null
}

// Wave 7 (2026-07-15, Attachments). `documents` is a hasMany/hasMany
// relation — never returned inline on the main property fetch above (no id
// lives directly on RealEstateProperty for it), so it needs its own read
// call. Best-effort: a failed documents fetch must not block loading the
// Edit page for everything else.
async function withDocuments(
  property: RealEstateProperty,
  headers: Record<string, string>,
): Promise<RealEstateProperty> {
  try {
    const res = await fetch(
      `${env.espoApiUrl}/RealEstateProperty/${property.id}/documents`,
      { headers, cache: 'no-store' },
    )
    if (!res.ok) return property
    const data: { list?: RealEstateProperty['documents'] } = await res.json()
    return { ...property, documents: data.list ?? [] }
  } catch {
    return property
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const property = await getProperty(slug)
  if (!property) return { title: 'Property Not Found' }

  const displayName = property.title || property.name
  return { title: displayName ? `Edit ${displayName}` : 'Edit Property' }
}

export default async function PropertyEditRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = await getProperty(slug)

  if (!property) notFound()

  return <PropertyFormPage mode="edit" property={property} />
}
