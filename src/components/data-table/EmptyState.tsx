import type { ElementType } from 'react'
import { FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  colSpan?: number
  icon?: ElementType
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  colSpan = 100,
  icon: Icon = FileSearch,
  title = 'No results found',
  description = 'Try adjusting your search or filter criteria.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn('py-16 text-center', className)}>
        <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60">
            <Icon className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {action && <div className="pt-1">{action}</div>}
        </div>
      </td>
    </tr>
  )
}
