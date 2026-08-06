'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SecondaryButton } from '@/components/shared'
import { PropertyCard } from '../PropertyCard'
import { fetchProperties } from '../../repositories/property.repository'
import { PROPERTIES_QUERY_KEY } from '../../domain/constants'
import { PAGE_PADDING_X } from '../../lib/page-layout'
import { cn } from '@/lib/utils'
import type { RealEstateProperty } from '../../types/property.types'

interface RelatedPropertiesSectionProps {
  currentId: string
  type?:     string
  onView:    (p: RealEstateProperty) => void
  onEdit:    (p: RealEstateProperty) => void
  onDelete:  (p: RealEstateProperty) => void
}

export function RelatedPropertiesSection({ currentId, type, onView, onEdit, onDelete }: RelatedPropertiesSectionProps) {
  const { t } = useTranslation('properties')
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
    // Same shared PAGE_PADDING_X as PropertyDetailView (see lib/page-layout.ts)
    // — this section sets its own outer inset since it's a sibling div after
    // the page's main grid, not nested inside it, but still shares that
    // grid's parent `max-w-450` wrapper, so it needs the identical gutter to
    // stay edge-aligned with everything above it.
    <div className={cn('mt-12', PAGE_PADDING_X)}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
            {t('related.similarProperties')}
          </p>
          {!isLoading && (
            <p className="text-[11px] text-muted-foreground/45">
              {/* Enterprise Product Review pass (2026-07-23): the previous
                  single suffix (`'s' : 'y'`) only pluralized correctly for
                  the untyped "propert" stem — singular read as "apartmenty"
                  once a real type was present, and plural read as "properts"
                  without one. Two real noun forms instead of one stem plus
                  a mismatched suffix. Enterprise Localization pass
                  (2026-07-24): the "property"/"properties" fallback words and
                  " in portfolio" suffix are now translated; `type` itself
                  (when present) is real API data and stays untouched,
                  English 's' pluralization suffix included — that's existing
                  display behavior, not something this pass changes. */}
              {t('related.inPortfolio', {
                count: list.length,
                type: list.length === 1
                  ? (type ? type.toLowerCase() : t('related.propertyFallback'))
                  : (type ? `${type.toLowerCase()}s` : t('related.propertiesFallback')),
              })}
            </p>
          )}
        </div>
        {/* Button System — Variant 2 (Secondary Action). Same component as
            PropertySpecsBar's "Full Specifications" and PropertyTimeline's
            "Show all N events" — one implementation for every secondary CTA
            in the Property Details experience. */}
        <SecondaryButton href="/properties" label={t('related.browseAll')} />
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
