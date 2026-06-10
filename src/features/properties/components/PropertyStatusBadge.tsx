'use client'

import { cn } from '@/lib/utils'

// ── Color maps — extend when EspoCRM entity adds new status values ─────────────

const DOT: Record<string, string> = {
  Available:        'bg-emerald-500',
  Pending:          'bg-amber-400',
  'Under Approval': 'bg-orange-400',
  Rented:           'bg-teal-500',
  Sold:             'bg-rose-500',
  Draft:            'bg-slate-400',
}

// chip = default badge (content area) — deliberately soft, supporting role only
const CHIP: Record<string, string> = {
  Available:        'bg-brand-emerald-soft text-brand-emerald  border-brand-emerald/20',
  Pending:          'bg-amber-50           text-amber-700      border-amber-200',
  'Under Approval': 'bg-orange-50          text-orange-700     border-orange-200',
  Rented:           'bg-brand-teal-soft    text-brand-teal     border-brand-teal/20',
  Sold:             'bg-brand-crimson-soft text-brand-crimson  border-brand-crimson/20',
  Draft:            'bg-secondary          text-muted-foreground border-border/60',
}

const FALLBACK_DOT  = 'bg-muted-foreground/40'
const FALLBACK_CHIP = 'bg-secondary text-muted-foreground border-border/60'

interface PropertyStatusBadgeProps {
  status: string
  className?: string
  variant?: 'default' | 'overlay'
}

export function PropertyStatusBadge({
  status,
  className,
  variant = 'default',
}: PropertyStatusBadgeProps) {
  const dot  = DOT[status]  ?? FALLBACK_DOT
  const chip = CHIP[status] ?? FALLBACK_CHIP

  if (variant === 'overlay') {
    return (
      <span
        className={cn(
          'inline-flex h-5 items-center gap-1.5 rounded-full px-2',
          'text-[9.5px] font-medium text-white/90',
          'bg-black/40 backdrop-blur-sm shadow-sm',
          'whitespace-nowrap',
          className,
        )}
      >
        <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-full border px-2',
        'text-[10px] font-medium leading-none tracking-wide',
        'whitespace-nowrap',
        chip,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      {status}
    </span>
  )
}
