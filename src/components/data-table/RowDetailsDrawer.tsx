'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StatusBadge } from './StatusBadge'
import { TableRowActions } from './TableRowActions'
import type { ColumnConfig, RowAction } from './types'

// ── Avatar helpers (mirrored from DataTable) ─────────────────────────────────

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

// ── Field row ─────────────────────────────────────────────────────────────────

function DetailRow<T extends object>({
  col,
  value,
  row,
}: {
  col: ColumnConfig<T>
  value: unknown
  row: T
}) {
  let rendered: ReactNode

  switch (col.type) {
    case 'badge':
      rendered = <StatusBadge value={String(value ?? '—')} badgeMap={col.badgeMap} />
      break

    case 'currency': {
      const n = Number(value)
      rendered = isNaN(n) ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="font-semibold tabular-nums text-foreground">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: col.currency ?? 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(n)}
        </span>
      )
      break
    }

    case 'date': {
      if (!value) {
        rendered = <span className="text-muted-foreground">—</span>
      } else {
        const d = new Date(String(value))
        rendered = isNaN(d.getTime()) ? (
          <span className="text-muted-foreground">{String(value)}</span>
        ) : (
          <span className="text-foreground">
            {d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )
      }
      break
    }

    case 'number': {
      const n = Number(value)
      rendered = (
        <span className="tabular-nums text-foreground">
          {isNaN(n) ? '—' : n.toLocaleString('en-US')}
        </span>
      )
      break
    }

    case 'custom':
      rendered = col.render?.(value, row) ?? <span className="text-muted-foreground">—</span>
      break

    default:
      rendered = (
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? String(value) : '—'}
        </span>
      )
  }

  return (
    <div className="flex items-start justify-between gap-6 px-5 py-3">
      <span className="shrink-0 text-[12px] text-muted-foreground">{col.label}</span>
      <div className="text-right text-[13px] leading-relaxed">{rendered}</div>
    </div>
  )
}

// ── RowDetailsDrawer ──────────────────────────────────────────────────────────

interface RowDetailsDrawerProps<T extends object> {
  open: boolean
  onClose: () => void
  row: T | undefined
  columns: ColumnConfig<T>[]
  rowActions?: RowAction<T>[]
  renderContent?: (row: T) => ReactNode
}

export function RowDetailsDrawer<T extends object>({
  open,
  onClose,
  row,
  columns,
  rowActions = [],
  renderContent,
}: RowDetailsDrawerProps<T>) {
  const { t } = useTranslation('common')
  if (!row) return null

  const r = row as Record<string, unknown>
  const primaryCol = columns.find((c) => c.type === 'avatar')
  const primaryName = primaryCol ? String(r[primaryCol.key] ?? '') : ''
  const primarySub = primaryCol?.subtitleKey
    ? String(r[primaryCol.subtitleKey] ?? '')
    : ''

  // Columns to show in detail rows — skip hidden defaults but show everything else
  const detailCols = columns.filter((c) => c.type !== 'image' && c.type !== 'avatarStack')

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]"
      >
        {/* ── Header ── */}
        <SheetHeader className="border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3 pr-8">
            {primaryName && (
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold',
                  avatarColor(primaryName),
                )}
              >
                {getInitials(primaryName) || '?'}
              </div>
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate text-[15px] font-semibold">
                {primaryName || t('table.recordDetails')}
              </SheetTitle>
              {primarySub && (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {primarySub}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {renderContent ? (
            <div className="p-5">{renderContent(row)}</div>
          ) : (
            <div className="divide-y divide-border/30">
              {detailCols.map((col) => (
                <DetailRow key={col.key} col={col} value={r[col.key]} row={row} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: row actions ── */}
        {rowActions.length > 0 && (
          <div className="border-t border-border/50 bg-muted/20 px-5 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('table.actions')}
            </p>
            <div className="flex flex-wrap gap-2">
              {rowActions
                .filter((action) => !action.hidden?.(row))
                .map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      onClick={() => {
                        action.onClick(row)
                        onClose()
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5',
                        'text-[12px] font-medium transition-colors duration-150',
                        action.variant === 'destructive'
                          ? 'border-destructive/25 text-destructive hover:bg-destructive/8'
                          : 'border-border/60 text-foreground hover:bg-muted/60',
                      )}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {action.label}
                    </button>
                  )
                })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
