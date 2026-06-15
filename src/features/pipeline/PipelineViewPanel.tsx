import { StatusBadge } from '@/components/data-table/StatusBadge'
import { EntityViewField } from '@/components/crud/EntityViewField'
import { STAGE_LABEL_MAP, STATUS_BADGE_MAP, CONTACT_TYPE_BADGE_MAP } from './fields'
import type { Pipeline } from './types'
import type { BadgeVariant } from '@/components/data-table'

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function PipelineViewPanel({ row }: { row: Pipeline }) {
  const contactName  = Object.values(row.contactsNames ?? {})[0] ?? '—'
  const teams        = Object.values(row.teamsNames ?? {}).join(', ') || '—'
  const properties   = Object.values(row.realEstatePropertiesNames ?? {}).join(', ') || '—'
  const stageLabel   = row.status2 && row.status2 !== 'none' ? (STAGE_LABEL_MAP[row.status2] ?? row.status2) : '—'
  const contactTypeLabel =
    row.contactType === 'κλήση'    ? 'κλήση / follow up'    :
    row.contactType === 'ραντεβού' ? 'ραντεβού / meeting'   :
    row.contactType || '—'

  return (
    <div className="px-5 py-2">
      <EntityViewField label="Contact">
        <span className="font-medium">{contactName}</span>
      </EntityViewField>
      <EntityViewField label="Assigned User">
        <span>{row.assignedUserName || '—'}</span>
      </EntityViewField>
      <EntityViewField label="Status">
        {row.status
          ? <StatusBadge value={row.status} badgeMap={STATUS_BADGE_MAP as Record<string, BadgeVariant>} />
          : <span className="text-muted-foreground">—</span>}
      </EntityViewField>
      <EntityViewField label="Stage">
        <span>{stageLabel}</span>
      </EntityViewField>
      <EntityViewField label="Contact Type">
        {row.contactType
          ? <StatusBadge value={contactTypeLabel} badgeMap={CONTACT_TYPE_BADGE_MAP as Record<string, BadgeVariant>} />
          : <span className="text-muted-foreground">—</span>}
      </EntityViewField>
      <EntityViewField label="Date Start">
        <span className="tabular-nums">{formatDate(row.dateStart)}</span>
      </EntityViewField>
      <EntityViewField label="Date End">
        <span className="tabular-nums">{formatDate(row.dateEnd)}</span>
      </EntityViewField>
      <EntityViewField label="Teams">
        <span>{teams}</span>
      </EntityViewField>
      <EntityViewField label="Properties">
        <span>{properties}</span>
      </EntityViewField>
      {row.description && (
        <EntityViewField label="Description">
          <span className="whitespace-pre-wrap text-left">{row.description}</span>
        </EntityViewField>
      )}
    </div>
  )
}
