'use client'

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BulkAction } from './types'

interface TableBulkActionsProps<T> {
  selectedRows: T[]
  actions: BulkAction<T>[]
  onClear: () => void
}

export function TableBulkActions<T>({ selectedRows, actions, onClear }: TableBulkActionsProps<T>) {
  const { t } = useTranslation('common')
  if (selectedRows.length === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-accent/60 px-3.5 py-2.5">
      <span className="text-[13px] font-semibold text-foreground">
        {t('table.selected', { count: selectedRows.length })}
      </span>

      <span className="h-4 w-px bg-border/70" />

      <div className="flex items-center gap-1.5">
        {actions.map((action, i) => (
          <Button
            key={i}
            size="sm"
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            onClick={() => action.onClick(selectedRows)}
            className={cn(
              'h-7 gap-1.5 text-xs',
              action.variant !== 'destructive' &&
                'border-border/60 bg-card text-foreground hover:bg-muted',
            )}
          >
            {action.icon && <action.icon className="h-3.5 w-3.5" />}
            {action.label}
          </Button>
        ))}
      </div>

      <button
        onClick={onClear}
        aria-label={t('table.clearSelection')}
        className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
