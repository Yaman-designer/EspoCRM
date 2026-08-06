'use client'

import { useTranslation } from 'react-i18next'
import type { Row } from '@/shared/detail-view'

// Label/value fact grid — extracted from the Property details page's
// Financial Detail block. Takes the same `Row[]` shape `buildOptionalRows`
// produces, so a ViewModel's optional-field rows can flow straight into
// this component with no adapter. Width-responsive
// (`auto-fit`/`minmax`), not viewport-responsive, so it behaves correctly
// regardless of which column width it's placed in.
//
// Enterprise Localization pass (2026-07-24): `row.label` (literal display
// text) is now `row.labelKey` (an i18next key against the 'properties'
// namespace) — see Row's own note in shared/detail-view/rows.ts for why.
export function DefinitionList({ rows }: { rows: Row[] }) {
  const { t } = useTranslation('properties')
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
      {rows.map(row => (
        <div key={row.labelKey}>
          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t(row.labelKey)}</div>
          <div className="text-sm font-black text-foreground">{row.value}</div>
        </div>
      ))}
    </div>
  )
}
