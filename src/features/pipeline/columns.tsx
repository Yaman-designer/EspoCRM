import type { ColumnConfig } from '@/components/data-table'
import { cn } from '@/lib/utils'
import type { Pipeline } from './types'
import { STAGE_BADGE_MAP, STATUS_BADGE_MAP } from './fields'
import type { BadgeVariant } from '@/components/data-table'

// ── Probability progress cell ──────────────────────────────────────────────────

function ProbabilityCell({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))

  const track =
    pct >= 75 ? 'bg-brand-emerald' :
    pct >= 50 ? 'bg-primary' :
    pct >= 25 ? 'bg-chart-4' :
    'bg-chart-5'

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-300', track)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-[12px] font-medium tabular-nums text-foreground">
        {pct}%
      </span>
    </div>
  )
}

// ── Column definitions ─────────────────────────────────────────────────────────

export const pipelineColumns: ColumnConfig<Pipeline>[] = [
  {
    key: 'title',
    label: 'Name',
    type: 'avatar',
    subtitleKey: 'company',
    sortable: true,
  },
  {
    key: 'owner',
    label: 'Assigned User',
    type: 'avatar',
    subtitleKey: 'ownerEmail',
    sortable: true,
    responsive: 'md',
  },
  {
    key: 'stage',
    label: 'Status in Pipeline',
    type: 'badge',
    badgeMap: STAGE_BADGE_MAP as Record<string, BadgeVariant>,
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    badgeMap: STATUS_BADGE_MAP as Record<string, BadgeVariant>,
  },
  {
    key: 'value',
    label: 'Amount',
    type: 'currency',
    currency: 'USD',
    sortable: true,
  },
  {
    key: 'probability',
    label: 'Probability',
    type: 'custom',
    sortable: true,
    responsive: 'lg',
    render: (value) => <ProbabilityCell value={Number(value ?? 0)} />,
  },
  {
    key: 'closingDate',
    label: 'Close Date',
    type: 'date',
    sortable: true,
    responsive: 'xl',
  },
  {
    key: 'updatedAt',
    label: 'Date Modified',
    type: 'date',
    sortable: true,
    responsive: 'xl',
    defaultHidden: true,
  },
  {
    key: 'createdAt',
    label: 'Date Created',
    type: 'date',
    sortable: true,
    responsive: 'xl',
    defaultHidden: true,
  },
]
