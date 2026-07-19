'use client'

import { useQuery } from '@tanstack/react-query'
import { resourceRegistry, type ResourceOption } from '@/shared/registry'

// ── Domain type exposed for non-select use-cases ───────────────────────────────

export interface Contact {
  id: string
  name: string
}

// ── Select options (label = name, value = id) — used by MultiSelectField ───────
// Capped at 200 (see resourceRegistry.contacts) — same static-list pattern as
// useUsers/useRegionLocations, chosen over a live search endpoint per the
// Contacts & Property Location Business Group Audit, §6.2 (Option A).

export function useContacts() {
  const def = resourceRegistry.contacts
  return useQuery<ResourceOption[]>({
    queryKey: def.queryKey,
    queryFn: def.queryFn,
    staleTime: def.staleTime,
  })
}
