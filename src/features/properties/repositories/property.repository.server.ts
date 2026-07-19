import { env } from '@/lib/env'
import type { RealEstateProperty } from '../types/property.types'

// Server-Component-only counterpart to property.repository.ts. That file's
// functions all go through axiosClient's '/api/espo' relative-path proxy —
// a pattern that only resolves in a browser context. Server Components run
// before any browser exists and must call EspoCRM directly with an absolute
// URL (env.espoApiUrl, deliberately not NEXT_PUBLIC_ — see lib/env.ts) and
// an explicit auth header the caller supplies from its own auth() call.
//
// Extracted from [slug]/page.tsx and [slug]/edit/page.tsx (Architecture
// Debt Rank #8), which had each independently implemented this identical
// propertyCode-then-id fallback fetch. The edit route's own prior comment
// explained why it never shared this with the detail route's copy instead:
// that copy lived inside a Next.js `page.tsx` file, which isn't a module
// other routes should import from. A real, non-page.tsx module resolves
// that — callers still own their own auth() call and any relation
// enrichment (documents, activity) on top of the base record this returns.

export async function fetchPropertyBySlug(
  slug: string,
  headers: Record<string, string>,
): Promise<RealEstateProperty | null> {
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

  try {
    const idRes = await fetch(
      `${env.espoApiUrl}/RealEstateProperty/${encodeURIComponent(slug)}`,
      { headers, cache: 'no-store' },
    )
    if (idRes.ok) return await idRes.json() as RealEstateProperty
  } catch { /* not found */ }

  return null
}
