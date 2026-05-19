import type { ColumnConfig } from '@/components/data-table'
import type { BadgeVariant } from '@/components/data-table'
import type { Pipeline } from './types'
import { STAGE_LABEL_MAP, STATUS_BADGE_MAP, CONTACT_TYPE_BADGE_MAP } from './fields'

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstValue(obj: Record<string, string> | undefined): string {
  if (!obj) return '—'
  const first = Object.values(obj)[0]
  return first || '—'
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Column definitions ────────────────────────────────────────────────────────

export const pipelineColumns: ColumnConfig<Pipeline>[] = [
  {
    key: 'contactsNames',
    label: 'Contact',
    type: 'custom',
    sortable: false,
    render: (_value, row) => {
      const name = firstValue(row.contactsNames)
      return (
        <div className="flex flex-col min-w-0">
          <span className="truncate text-[13px] font-semibold text-foreground">{name}</span>
          {row.description && (
            <span className="truncate text-[11px] text-muted-foreground">{row.description}</span>
          )}
        </div>
      )
    },
  },
  {
    key: 'assignedUserName',
    label: 'Assigned User',
    type: 'avatar',
    sortable: true,
    responsive: 'md',
  },
  {
    key: 'contactType',
    label: 'Contact Type',
    type: 'badge',
    badgeMap: CONTACT_TYPE_BADGE_MAP as Record<string, BadgeVariant>,
    sortable: true,
  },
  {
    key: 'status2',
    label: 'Stage',
    type: 'custom',
    sortable: true,
    render: (value) => {
      const v = String(value ?? '')
      if (!v || v === 'none') return <span className="text-muted-foreground text-[12px]">—</span>
      const label = STAGE_LABEL_MAP[v] ?? v
      return <span className="text-[12px] text-foreground">{label}</span>
    },
  },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    badgeMap: STATUS_BADGE_MAP as Record<string, BadgeVariant>,
    sortable: true,
  },
  {
    key: 'dateStart',
    label: 'Date',
    type: 'custom',
    sortable: true,
    render: (value) => (
      <span className="text-[12px] tabular-nums text-foreground">
        {formatDate(String(value ?? ''))}
      </span>
    ),
  },
  {
    key: 'teamsNames',
    label: 'Team',
    type: 'custom',
    sortable: false,
    responsive: 'lg',
    render: (_value, row) => {
      const name = firstValue(row.teamsNames)
      return <span className="text-[12px] text-foreground">{name}</span>
    },
  },
]
