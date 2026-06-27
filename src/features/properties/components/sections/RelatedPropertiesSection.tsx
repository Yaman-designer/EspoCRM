'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Building2, ArrowRight } from 'lucide-react'
import { PropertyCard } from '../PropertyCard'
import { fetchProperties } from '../../repositories/property.repository'
import { PROPERTIES_QUERY_KEY } from '../../domain/constants'
import type { RealEstateProperty } from '../../types/property.types'

interface RelatedPropertiesSectionProps {
  currentId: string
  type?:     string
  onView:    (p: RealEstateProperty) => void
  onEdit:    (p: RealEstateProperty) => void
  onDelete:  (p: RealEstateProperty) => void
}

export function RelatedPropertiesSection({ currentId, type, onView, onEdit, onDelete }: RelatedPropertiesSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, 'related', type, currentId],
    queryFn: async () => {
      const whereParams: Record<string, string> = {}
      if (type) {
        whereParams['where[0][type]']      = 'equals'
        whereParams['where[0][attribute]'] = 'type'
        whereParams['where[0][value]']     = type
      }
      const result = await fetchProperties(
        { maxSize: 6, offset: 0, orderBy: 'createdAt', order: 'desc' },
        whereParams,
      )
      return result.list.filter(p => p.id !== currentId).slice(0, 4)
    },
    staleTime: 60_000,
  })

  const list = data ?? []

  if (!isLoading && list.length === 0) return null

  return (
    <div className="mt-12 px-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
            Similar Properties
          </p>
          {!isLoading && (
            <p className="text-[11px] text-muted-foreground/45">
              {list.length} {type ? type.toLowerCase() : 'propert'}{list.length !== 1 ? 's' : 'y'} in portfolio
            </p>
          )}
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
        >
          Browse all
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-3/4 animate-pulse rounded-3xl bg-muted/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map(p => (
            <PropertyCard key={p.id} property={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
