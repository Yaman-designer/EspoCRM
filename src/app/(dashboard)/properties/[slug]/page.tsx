import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import type { RealEstateProperty } from '@/features/properties/types/property.types'
import { PropertyDetailPage } from '@/features/properties/pages/PropertyDetailPage'
import { fetchPropertyBySlug } from '@/features/properties/repositories/property.repository.server'

// ── Server-side property fetch ─────────────────────────────────────────────────
//
// Base record fetch (propertyCode match, then direct ID fallback) lives in
// property.repository.server.ts, shared with [slug]/edit/page.tsx
// (Architecture Debt Rank #8) — this function only owns the auth() call and
// this route's own relation enrichment (withActivity below).

async function getProperty(slug: string): Promise<RealEstateProperty | null> {
  const session = await auth()
  if (!session?.espoToken) return null

  const headers: Record<string, string> = {
    'Espo-Authorization': session.espoToken,
  }

  const property = await fetchPropertyBySlug(slug, headers)
  if (!property) return null
  const withActivityResult = await withActivity(property, headers)
  return withDocuments(withActivityResult, headers)
}

// Property Details Completion (2026-07-17). documents is a hasMany/hasMany
// relation to Document (see document.repository.ts's file header) — never
// part of the standard entity payload, same reason calls/meetings/tasks
// below each need their own read call. Previously never fetched at all here,
// which is why the Legal tab (AssetManagementSystem.tsx) always rendered its
// hardcoded empty state regardless of whether real documents existed.
async function withDocuments(
  property: RealEstateProperty,
  headers: Record<string, string>,
): Promise<RealEstateProperty> {
  const documents = await fetchRelation<NonNullable<RealEstateProperty['documents']>[number]>(property.id, 'documents', headers)
  return { ...property, documents }
}

// EC-8 (2026-07-15, Detail Page Relationship Panels). Calls/Meetings/Tasks
// are hasChildren relations — never returned inline on the main property
// fetch above — so each needs its own read call, same pattern as Wave 7's
// withDocuments(). Best-effort per relation: one failing must not block the
// other two or the property page itself.
async function withActivity(
  property: RealEstateProperty,
  headers: Record<string, string>,
): Promise<RealEstateProperty> {
  const [calls, meetings, tasks] = await Promise.all([
    fetchRelation<NonNullable<RealEstateProperty['calls']>[number]>(property.id, 'calls', headers),
    fetchRelation<NonNullable<RealEstateProperty['meetings']>[number]>(property.id, 'meetings', headers),
    fetchRelation<NonNullable<RealEstateProperty['tasks']>[number]>(property.id, 'tasks', headers),
  ])
  return { ...property, calls, meetings, tasks }
}

async function fetchRelation<T>(propertyId: string, relation: string, headers: Record<string, string>): Promise<T[]> {
  try {
    const res = await fetch(`${env.espoApiUrl}/RealEstateProperty/${propertyId}/${relation}`, { headers, cache: 'no-store' })
    if (!res.ok) return []
    const data: { list?: T[] } = await res.json()
    return data.list ?? []
  } catch {
    return []
  }
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
