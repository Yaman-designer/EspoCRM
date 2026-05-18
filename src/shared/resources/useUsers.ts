'use client'

import { useQuery } from '@tanstack/react-query'
import { resourceRegistry, type ResourceOption } from '@/shared/registry'

// ── Domain type exposed for non-select use-cases ───────────────────────────────

export interface User {
  id: string
  name: string
  emailAddress?: string
}

// ── Select options (label = name, value = id) — used by FormSelect ─────────────

export function useUsers() {
  const def = resourceRegistry.users
  return useQuery<ResourceOption[]>({
    queryKey: def.queryKey,
    queryFn: def.queryFn,
    staleTime: def.staleTime,
  })
}
