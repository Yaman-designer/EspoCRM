'use client'

import { Settings2, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ColumnConfig } from './types'

interface ColumnVisibilityProps<T> {
  columns: ColumnConfig<T>[]
  visibleColumns: Set<string>
  onToggle: (key: string) => void
}

export function ColumnVisibility<T>({
  columns,
  visibleColumns,
  onToggle,
}: ColumnVisibilityProps<T>) {
  const toggleable = columns.filter(
    (c) => c.hideable !== false && c.key !== '_actions' && c.key !== '_select',
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border/60 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Columns
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={6} className="w-48 p-2">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Toggle columns
        </p>
        <div className="space-y-0.5">
          {toggleable.map((col) => {
            const visible = visibleColumns.has(col.key)
            return (
              <button
                key={col.key}
                onClick={() => onToggle(col.key)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <span
                  className={cn(
                    'text-[13px]',
                    visible ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {col.label}
                </span>
                {visible && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
