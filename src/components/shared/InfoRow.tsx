'use client'

import { useTranslation } from 'react-i18next'
import type { Row } from '@/shared/detail-view'

// Label/value cell — extracted after verifying LandDetailsCard's
// `numberRows` and PropertySpecsBar's `FullSpecsDialog` group rows against
// real source: identical cell markup (`text-[8px] font-bold
// text-muted-foreground uppercase tracking-wider mb-1` / `text-sm
// font-black text-foreground`). Deliberately distinct from the shared
// `DefinitionList` (Financial Intelligence's own row recipe uses a dimmed
// `text-muted-foreground/45` label — a real, verified pixel difference, not
// merged away).
//
// Each caller keeps its own outer grid wrapper — Land uses
// `grid-cols-2 sm:grid-cols-4`, Specs' modal uses
// `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — the two grids were never
// the same shape, only the cell inside them was.
//
// Enterprise Localization pass (2026-07-24): `label` (literal display text)
// is now `labelKey` (an i18next key against the 'properties' namespace) —
// see Row's own note in shared/detail-view/rows.ts for why.
export function InfoRow({ labelKey, value }: Row) {
  const { t } = useTranslation('properties')
  return (
    <div>
      <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t(labelKey)}</div>
      <div className="text-sm font-black text-foreground">{value}</div>
    </div>
  )
}
