import { cn } from '@/lib/utils'

/** Square icon-button used across the top navbar */
export const btnCls = cn(
  'flex h-10 w-10 items-center justify-center rounded-xl border border-border',
  'bg-background text-muted-foreground transition-all duration-200',
  'hover:bg-muted hover:text-foreground',
)
