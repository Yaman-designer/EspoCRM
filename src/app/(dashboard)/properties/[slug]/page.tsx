import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import type { RealEstateProperty } from '@/features/properties/types/property.types'
import { PropertyDetailPage } from '@/features/properties/pages/PropertyDetailPage'

// ── Server-side property fetch ─────────────────────────────────────────────────
//
// Strategy:
//  1. Try slug.toUpperCase() as propertyCode  (e.g. "dvl68645" → "DVL68645")
//  2. Fall back to a direct ID fetch          (for UUID-based slugs)

async function getProperty(slug: string): Promise<RealEstateProperty | null> {
  const session = await auth()
  if (!session?.espoToken) return null

  const headers: Record<string, string> = {
    'Espo-Authorization': session.espoToken,
  }

  // ── Attempt 1: propertyCode match ──────────────────────────────────────────
  try {
    const codeUrl = new URL(`${env.espoApiUrl}/RealEstateProperty`)
    codeUrl.searchParams.set('maxSize', '1')
    codeUrl.searchParams.set('where[0][type]', 'equals')
    codeUrl.searchParams.set('where[0][attribute]', 'propertyCode')
    codeUrl.searchParams.set('where[0][value]', slug.toUpperCase())

    const codeRes = await fetch(codeUrl.toString(), { headers, cache: 'no-store' })
    if (codeRes.ok) {
      const data: { list?: RealEstateProperty[] } = await codeRes.json()
      if (data.list?.[0]) return data.list[0]
    }
  } catch { /* ignore — try ID next */ }

  // ── Attempt 2: direct ID fetch ─────────────────────────────────────────────
  try {
    const idRes = await fetch(
      `${env.espoApiUrl}/RealEstateProperty/${encodeURIComponent(slug)}`,
      { headers, cache: 'no-store' },
    )
    if (idRes.ok) return (await idRes.json()) as RealEstateProperty
  } catch { /* not found */ }

  return null
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const property = await getProperty(slug)
  if (!property) return { title: 'Property Not Found' }

  const displayName = property.title || property.name
  return {
    title: displayName ? `${displayName} | Properties` : 'Property Details',
    description: property.description?.slice(0, 160) ?? undefined,
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PropertyDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = await getProperty(slug)

  if (!property) notFound()

  return <PropertyDetailPage property={property} />
}
