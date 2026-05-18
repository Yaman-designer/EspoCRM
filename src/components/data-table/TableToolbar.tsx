'use client'

import type { ReactNode } from 'react'
import { Search, Plus, Download, RefreshCw } from 'lucide-react'
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

  exportable?: boolean
  addable?: boolean
  addLabel?: string
  onAdd?: () => void
  onExport?: () => void

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
  exportable = false,
  addable = true,
  addLabel = 'Add New',
  onAdd,
  onExport,
  onRefetch,
  isRefetching = false,
  columnVisibility,
  viewToggle,
  bulkActions,
  extraActions,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn('border-b border-border/50 bg-card px-5 py-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Left: title (only rendered when provided) */}
        {title && (
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {subtitle ??
                (totalRows !== undefined
                  ? `${totalRows.toLocaleString('en-US')} record${totalRows !== 1 ? 's' : ''}`
                  : '')}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className={cn('flex flex-wrap items-center gap-2', !title && 'w-full justify-between')}>
          {/* Record count when no title */}
          {!title && totalRows !== undefined && (
            <span className="text-[12px] text-muted-foreground">
              {totalRows.toLocaleString('en-US')} record{totalRows !== 1 ? 's' : ''}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {searchable && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-48 pl-8 text-xs placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                />
              </div>
            )}

            {columnVisibility}

            {viewToggle}

            {onRefetch && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefetch}
                disabled={isRefetching}
                aria-label="Refresh"
                className="h-8 w-8 border-border/60"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
              </Button>
            )}

            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8 gap-1.5 border-border/60 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}

            {extraActions}

            {addable && onAdd && (
              <Button size="sm" onClick={onAdd} className="h-8 gap-1.5 text-xs font-medium">
                <Plus className="h-4 w-4" />
                {addLabel}
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
