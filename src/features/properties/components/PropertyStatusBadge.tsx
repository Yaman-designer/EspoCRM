'use client'

import { cn } from '@/lib/utils'
import { STATUS_DOT_COLORS, STATUS_DOT_FALLBACK } from '../domain/constants'

// ── Color maps ────────────────────────────────────────────────────────────────

// Tinted glassmorphic background for overlay (image) variant
const OVERLAY_TINT: Record<string, string> = {
  Available:        'border-emerald-400/40 bg-emerald-500/35',
  Reserved:         'border-amber-400/40   bg-amber-500/35',
  Pending:          'border-violet-400/40  bg-violet-500/35',
  'Under Approval': 'border-orange-400/40  bg-orange-500/35',
  Rented:           'border-teal-400/40    bg-teal-500/35',
  Sold:             'border-rose-400/40    bg-rose-500/35',
  Draft:            'border-slate-400/30   bg-slate-500/28',
}

// Soft chip for content area — supporting role only
const CHIP: Record<string, string> = {
  Available:        'bg-brand-emerald-soft text-brand-emerald  border-brand-emerald/20',
  Reserved:         'bg-amber-50           text-amber-700      border-amber-200',
  Pending:          'bg-violet-50          text-violet-700     border-violet-200',
  'Under Approval': 'bg-orange-50          text-orange-700     border-orange-200',
  Rented:           'bg-brand-teal-soft    text-brand-teal     border-brand-teal/20',
  Sold:             'bg-brand-crimson-soft text-brand-crimson  border-brand-crimson/20',
  Draft:            'bg-secondary          text-muted-foreground border-border/60',
}

const FALLBACK_OVERLAY_TINT = 'border-white/10 bg-black/40'
const FALLBACK_CHIP         = 'bg-secondary text-muted-foreground border-border/60'

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
  const dot  = STATUS_DOT_COLORS[status] ?? STATUS_DOT_FALLBACK
  const chip = CHIP[status]         ?? FALLBACK_CHIP
  const tint = OVERLAY_TINT[status] ?? FALLBACK_OVERLAY_TINT

  if (variant === 'overlay') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border',
          'h-7 gap-1.5 px-3 text-[10.5px] sm:h-5.5 sm:gap-1 sm:px-2.5 sm:text-[9.5px]',
          'font-bold tracking-wide text-white',
          'whitespace-nowrap',
          tint,
          className,
        )}
      >
        <span className={cn('size-1.5 shrink-0 rounded-full shadow-sm', dot)} />
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex h-5.5 items-center gap-1 rounded-full border px-2.5',
        'text-[10px] font-semibold leading-none tracking-wide whitespace-nowrap',
        'shadow-[0_1px_4px_rgba(0,0,0,0.08)]',
        chip,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      {status}
    </span>
  )
}
