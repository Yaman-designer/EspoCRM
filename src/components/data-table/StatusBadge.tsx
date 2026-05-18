import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BadgeVariant } from './types'

// ── Sensible defaults for common CRM / SaaS status strings ───────────────────
const DEFAULT_MAP: Record<string, BadgeVariant> = {
  // positive
  active: 'success',
  available: 'success',
  won: 'won',
  paid: 'success',
  approved: 'success',
  completed: 'success',
  delivered: 'success',
  published: 'success',
  verified: 'success',
  // in-progress
  pending: 'warning',
  'in-progress': 'on-process',
  processing: 'on-process',
  negotiating: 'negotiating',
  scheduled: 'visit',
  review: 'on-process',
  // new / informational
  new: 'new-lead',
  lead: 'new-lead',
  trial: 'info',
  // negative
  inactive: 'ghost',
  cancelled: 'cancelled',
  rejected: 'destructive',
  expired: 'destructive',
  failed: 'error',
  overdue: 'error',
  suspended: 'error',
  // neutral
  draft: 'secondary',
  archived: 'ghost',
  unknown: 'secondary',
}

interface StatusBadgeProps {
  value: string
  badgeMap?: Record<string, BadgeVariant>
  className?: string
}

export function StatusBadge({ value, badgeMap, className }: StatusBadgeProps) {
  const map = badgeMap ? { ...DEFAULT_MAP, ...badgeMap } : DEFAULT_MAP
  const key = value.toLowerCase().replace(/\s+/g, '-')
  const variant: BadgeVariant = map[key] ?? map[value] ?? 'secondary'

  return (
    <Badge variant={variant} className={cn('font-medium', className)}>
      {value}
    </Badge>
  )
}
