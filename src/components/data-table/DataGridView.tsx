'use client'

import { cn } from '@/lib/utils'
import type { ColumnConfig, RowAction } from './types'
import { StatusBadge } from './StatusBadge'
import { TableRowActions } from './TableRowActions'

// ── Shared helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-brand-emerald-soft text-brand-emerald',
  'bg-brand-azure-soft text-brand-azure',
  'bg-brand-teal-soft text-brand-teal',
  'bg-brand-lavender-soft text-brand-lavender',
  'bg-chart-4/15 text-chart-4',
] as const

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = ((h * 31) + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function formatCurrency(value: unknown, currency = 'USD') {
  const n = Number(value)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(value: unknown) {
  if (!value) return '—'
  const d = new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function GridCard<T extends object>({
  row,
  columns,
  rowActions,
  onRowClick,
}: {
  row: T
  columns: ColumnConfig<T>[]
  rowActions: RowAction<T>[]
  onRowClick?: (row: T) => void
}) {
  const r = row as Record<string, unknown>

  const avatarCols   = columns.filter((c) => c.type === 'avatar')
  const badgeCols    = columns.filter((c) => c.type === 'badge')
  const currencyCols = columns.filter((c) => c.type === 'currency')
  const customCols   = columns.filter((c) => c.type === 'custom')
  const dateCols     = columns.filter((c) => c.type === 'date' && !c.defaultHidden)

  const primary   = avatarCols[0]
  const secondary = avatarCols[1]

  return (
    <div
      onClick={() => onRowClick?.(row)}
      className={cn(
        'group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border/50 bg-card',
        'shadow-design-xs transition-all duration-200',
        'hover:border-border hover:shadow-design-sm hover:-translate-y-px',
        onRowClick && 'cursor-pointer',
      )}
    >
      {/* ── Top accent bar (colored by first badge variant) ── */}
      <div className="h-0.5 w-full bg-linear-to-r from-primary/40 via-primary/20 to-transparent" />

      {/* ── Card body ── */}
      <div className="flex flex-col gap-3 p-4">

        {/* ── Header: primary avatar + actions ── */}
        <div className="flex items-start justify-between gap-3">
          {primary ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold',
                  avatarColor(String(r[primary.key] ?? '')),
                )}
              >
                {getInitials(String(r[primary.key] ?? '')) || '?'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-snug text-foreground">
                  {String(r[primary.key] ?? '') || '—'}
                </p>
                {primary.subtitleKey && (
                  <p className="mt-0.5 truncate text-[12px] leading-snug text-muted-foreground">
                    {String(r[primary.subtitleKey] ?? '') || '—'}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {rowActions.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            >
              <TableRowActions row={row} actions={rowActions} />
            </div>
          )}
        </div>

        {/* ── Badges ── */}
        {badgeCols.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badgeCols.map((col) => (
              <StatusBadge
                key={col.key}
                value={String(r[col.key] ?? '—')}
                badgeMap={col.badgeMap}
              />
            ))}
          </div>
        )}

        {/* ── Currency metric ── */}
        {currencyCols.map((col) => (
          <div
            key={col.key}
            className="rounded-lg bg-muted/40 px-3 py-2.5 ring-1 ring-border/30"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {col.label}
            </p>
            <p className="mt-0.5 text-[18px] font-bold tabular-nums leading-tight text-foreground">
              {formatCurrency(r[col.key], col.currency)}
            </p>
          </div>
        ))}

        {/* ── Custom columns (e.g. probability bar) ── */}
        {customCols.map((col) => (
          <div key={col.key}>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {col.label}
            </p>
            {col.render?.(r[col.key], row) ?? null}
          </div>
        ))}
      </div>

      {/* ── Footer: secondary avatar + close date ── */}
      {(secondary || dateCols.length > 0) && (
        <div className="flex items-center justify-between gap-2 border-t border-border/30 bg-muted/20 px-4 py-2.5">
          {secondary ? (
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                  avatarColor(String(r[secondary.key] ?? '')),
                )}
              >
                {getInitials(String(r[secondary.key] ?? '')) || '?'}
              </div>
              <span className="truncate text-[12px] text-muted-foreground">
                {String(r[secondary.key] ?? '') || '—'}
              </span>
            </div>
          ) : <div />}

          {dateCols.slice(0, 1).map((col) => (
            <div key={col.key} className="shrink-0 text-right">
              <p className="text-[10px] text-muted-foreground/70">{col.label}</p>
              <p className="text-[12px] font-medium text-muted-foreground">
                {formatDate(r[col.key])}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DataGridView ──────────────────────────────────────────────────────────────

interface DataGridViewProps<T extends object> {
  rows: T[]
  columns: ColumnConfig<T>[]
  rowActions?: RowAction<T>[]
  onRowClick?: (row: T) => void
}

export function DataGridView<T extends object>({
  rows,
  columns,
  rowActions = [],
  onRowClick,
}: DataGridViewProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No records to display</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row, i) => (
        <GridCard
          key={i}
          row={row}
          columns={columns}
          rowActions={rowActions}
          onRowClick={onRowClick}
        />
      ))}
    </div>
  )
}
