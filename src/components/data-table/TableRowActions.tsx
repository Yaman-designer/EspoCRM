'use client'

import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RowAction } from './types'

interface TableRowActionsProps<T> {
  row: T
  actions: RowAction<T>[]
}

export function TableRowActions<T>({ row, actions }: TableRowActionsProps<T>) {
  const visible = actions.filter((a) => !a.hidden?.(row))
  if (visible.length === 0) return null

  const hasDestructive = visible.some((a) => a.variant === 'destructive')
  const safeActions = visible.filter((a) => a.variant !== 'destructive')
  const dangerActions = visible.filter((a) => a.variant === 'destructive')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'h-7 w-7 rounded-md text-muted-foreground',
            'opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100',
            'hover:bg-muted hover:text-foreground',
          )}
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 p-1">
        {safeActions.map((action, i) => (
          <DropdownMenuItem
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick(row)
            }}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
          >
            {action.icon && <action.icon className="h-3.5 w-3.5 text-muted-foreground" />}
            {action.label}
          </DropdownMenuItem>
        ))}

        {hasDestructive && safeActions.length > 0 && <DropdownMenuSeparator className="my-1" />}

        {dangerActions.map((action, i) => (
          <DropdownMenuItem
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick(row)
            }}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-destructive focus:bg-destructive/8 focus:text-destructive"
          >
            {action.icon && <action.icon className="h-3.5 w-3.5" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
