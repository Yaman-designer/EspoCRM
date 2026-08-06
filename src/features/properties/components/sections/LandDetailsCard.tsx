'use client'

import { LandPlot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionHeader, InfoRow } from '@/components/shared'
import type { LandViewModel } from '../../view-models/land.viewmodel'

// Property Details Completion (2026-07-17). The 14-field Land Details
// cluster from location-zoning.schema.ts — visible only when category =
// 'Land', same visibility rule as the Wizard's own LAND_CATEGORY condition
// (see domain/visibility.ts). No existing Details card has a zoning/parcel
// theme to extend, so this is a new, minimal card matching the existing
// visual language, rendered only for Land-category listings.
//
// Enterprise Product Review pass (2026-07-23): flag rows only render true
// flags — a property that simply lacks a building permit or isn't on a
// city plan is the ordinary case, not worth a "No" badge (same BOOLEAN
// STRATEGY Construction & Systems documents).
//
// Enterprise architecture pass (2026-07-23): category visibility, field
// selection, and the true-only flag filter used to live inline in this
// component; all now arrive pre-shaped via `LandViewModel` (see
// view-models/land.viewmodel.ts). `numberRows` renders through the shared
// `InfoRow` primitive — verified byte-identical against PropertySpecsBar's
// modal rows.

interface LandDetailsCardProps {
  viewModel: LandViewModel
}

export function LandDetailsCard({ viewModel }: LandDetailsCardProps) {
  const { t } = useTranslation('properties')
  const { numberRows, slopeValue, flagKeys, isVisible, isEmpty } = viewModel

  if (!isVisible || isEmpty) return null

  return (
    <section className="space-y-4">
      <SectionHeader title={t('land.title')} subtitle={t('land.subtitle')} />

      <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 space-y-6">
        {(numberRows.length > 0 || slopeValue) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {numberRows.map(row => <InfoRow key={row.labelKey} {...row} />)}
            {slopeValue && (
              <div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('land.slope')}</div>
                <div className="text-sm font-black text-foreground capitalize">{slopeValue}</div>
              </div>
            )}
          </div>
        )}

        {flagKeys.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-5">
            {flagKeys.map(flagKey => (
              <span
                key={flagKey}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70"
              >
                <LandPlot className="size-2.5 text-muted-foreground/50" />
                {t(flagKey)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
