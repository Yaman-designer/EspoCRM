export type SearchEntityType = 'Contact' | 'RealEstateRequest' | 'Account' | 'EblaContractParty'

export interface SearchResult {
  id: string
  name: string
  entityType: SearchEntityType
}

export const ENTITY_ROUTE: Record<SearchEntityType, string> = {
  Contact: '/contact',
  RealEstateRequest: '/request',
  Account: '/company',
  EblaContractParty: '/contracts',
}

export async function globalSearch(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
    signal,
  })

  if (!res.ok) return []
  return res.json()
}
