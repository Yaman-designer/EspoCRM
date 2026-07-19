'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPropertyKPIs, type KPIStats } from '../services/property.query.service'

// Business Analytics: fetchPropertyKPIs() already existed (available/pending/
// sold counts via 3 parallel fetchPropertyCount calls) but had zero
// consumers anywhere in the app — the Dashboard read only static fixture
// data. This hook is its first real consumer (see StatBar.tsx).
export function usePropertyKPIs() {
  return useQuery<KPIStats>({
    queryKey: ['property-kpis'],
    queryFn: fetchPropertyKPIs,
    staleTime: 60 * 1000,
  })
}
