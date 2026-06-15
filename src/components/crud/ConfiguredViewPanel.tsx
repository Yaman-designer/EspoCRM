import { EntityViewField } from './EntityViewField'
import { StatusBadge } from '@/components/data-table/StatusBadge'
import { formatDate, formatDatetime } from '@/lib/date'
import type { ViewFieldDef } from './resource-config'

// ── ConfiguredViewPanel ───────────────────────────────────────────────────────

/**
 * Renders a list of ViewFieldDef<T> as EntityViewField rows.
 *
 * Handles four rendering modes out of the box:
 *   text     — plain string (default)
 *   badge    — StatusBadge with optional badgeMap override
 *   date     — short localised date  (Jun 14, 2026)
 *   datetime — long localised date + time  (14 June 2026, 10:30)
 *
 * If the value is null, undefined, or an empty string the field still renders
 * with a muted em-dash so the layout stays consistent.
 *
 * For entity-specific layouts (composite values, nested objects, special
 * formatting) skip this component and write a custom view panel instead.
 */
export function ConfiguredViewPanel<T extends { id: string }>({
  row,
  fields,
}: {
  row: T
  fields: ViewFieldDef<T>[]
}) {
  return (
    <div className="px-5 py-2">
      {fields.map(({ key, label, type, badgeMap }) => {
        const raw = (row as Record<string, unknown>)[key]
        const isEmpty = raw == null || raw === ''

        return (
          <EntityViewField key={key} label={label}>
            {isEmpty ? (
              <span className="text-muted-foreground">—</span>
            ) : type === 'badge' ? (
              <StatusBadge value={String(raw)} badgeMap={badgeMap} />
            ) : type === 'date' ? (
              <span className="tabular-nums">{formatDate(String(raw))}</span>
            ) : type === 'datetime' ? (
              <span className="tabular-nums">{formatDatetime(String(raw))}</span>
            ) : (
              <span>{String(raw)}</span>
            )}
          </EntityViewField>
        )
      })}
    </div>
  )
}
