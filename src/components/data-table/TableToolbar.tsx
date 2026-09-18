'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TableToolbarProps {
  title?: string
  subtitle?: string
  totalRows?: number

  search: string
  onSearchChange: (val: string) => void
  searchPlaceholder?: string
  searchable?: boolean

  addable?: boolean
  addLabel?: string
  onAdd?: () => void

  onRefetch?: () => void
  isRefetching?: boolean

  columnVisibility?: ReactNode
  viewToggle?: ReactNode
  bulkActions?: ReactNode
  extraActions?: ReactNode

  className?: string
}

export function TableToolbar({
  title,
  subtitle,
  totalRows,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchable = true,
  addable = true,
  addLabel,
  onAdd,
  onRefetch,
  isRefetching = false,
  columnVisibility,
  viewToggle,
  bulkActions,
  extraActions,
  className,
}: TableToolbarProps) {
  const { t } = useTranslation('common')
  const resolvedAddLabel = addLabel ?? t('table.addNew')
  return (
    <div className={cn('border-b border-border/50 bg-card px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        {/* Left: title (only rendered when provided) */}
        {title && (
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {subtitle ??
                (totalRows !== undefined
                  ? t('table.records', { count: totalRows })
                  : '')}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className={cn('flex flex-wrap items-center gap-2', !title && 'w-full justify-between')}>
          {/* Record count when no title */}
          {!title && totalRows !== undefined && (
            <span className="text-[12px] text-muted-foreground">
              {t('table.records', { count: totalRows })}
            </span>
          )}

          {/*
           * ml-auto pins this cluster to the right on desktop. Explicit
           * `order` values below prioritize Search then the primary Add
           * action on mobile, letting secondary controls (columns, view
           * toggle, refresh, extras) wrap onto their own compact row —
           * `sm:order-0` restores original DOM order (unchanged desktop
           * layout) at the sm breakpoint and up.
           */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {searchable && (
              <div className="relative order-1 w-full sm:order-0 sm:w-auto">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full pl-8 text-xs placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 sm:w-48"
                />
              </div>
            )}

            {columnVisibility && (
              <span className="order-3 inline-flex sm:order-0">{columnVisibility}</span>
            )}

            {viewToggle && (
              <span className="order-4 inline-flex sm:order-0">{viewToggle}</span>
            )}

            {onRefetch && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefetch}
                disabled={isRefetching}
                aria-label={t('table.refresh')}
                className="order-5 h-8 w-8 border-border/60 sm:order-0"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
              </Button>
            )}

            {extraActions && (
              <span className="order-6 inline-flex sm:order-0">{extraActions}</span>
            )}

            {addable && onAdd && (
              <Button size="sm" onClick={onAdd} className="order-2 h-8 gap-1.5 text-xs font-medium sm:order-0">
                <Plus className="h-4 w-4" />
                {resolvedAddLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk actions (shown when rows are selected) ── */}
      {bulkActions && <div className="mt-3">{bulkActions}</div>}
    </div>
  )
}
