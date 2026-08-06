'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { STATUS_DOT_COLORS, STATUS_DOT_FALLBACK } from '../domain/constants'
import { createLabelResolver } from '../domain/label-resolution'

// Status → i18n key. Presentation only — the underlying `status` value
// stored/sent to EspoCRM is never touched; only what's rendered changes per
// active locale. Any value not in this map (future statuses added in
// EspoCRM before this map is updated) falls back to the raw value.
const STATUS_LABEL_KEY: Record<string, string> = {
  'Under Approval':   'underApproval',
  Active:              'active',
  Inactive:            'inactive',
  'Not Approved':      'notApproved',
  'Under negotiation': 'underNegotiation',
  'Received payment':  'receivedPayment',
  Rented:               'rented',
  Sold:                 'sold',
}

/**
 * Single public entry point for displaying a raw property `status` value —
 * translates via properties.json's `statuses.*` keys (or `statusesCompact.*`
 * when `{ compact: true }`), falling back to the raw value for anything
 * unmapped. Used both by PropertyStatusBadge itself and by the handful of
 * call sites that render `status` as plain text alongside the badge
 * component rather than through it (map popups, hero section). Callers never
 * need to know which namespace backs the result.
 */
export const getStatusLabel = createLabelResolver({
  namespace: 'statuses',
  compactNamespace: 'statusesCompact',
  keyMap: STATUS_LABEL_KEY,
  fallback: (value: string) => value,
})

// ── Color maps ────────────────────────────────────────────────────────────────
// Wave 2 (2026-07-14): rebuilt for the real 8-value live status enum, per the
// approved Status Design Specification (Gate 1→2 Resolution). Sold keeps its
// pre-existing crimson brand identity and Received payment is a deeper
// indigo than Under negotiation's violet — both deliberate deviations from
// EspoCRM's own flatter style mapping, reasoned in the Design Spec.

// Tinted glassmorphic background for overlay (image) variant
const OVERLAY_TINT: Record<string, string> = {
  'Under Approval':    'border-amber-400/40   bg-amber-500/35',
  Active:               'border-emerald-400/40 bg-emerald-500/35',
  Inactive:             'border-slate-400/30   bg-slate-500/28',
  'Not Approved':       'border-rose-400/40    bg-rose-500/35',
  'Under negotiation':  'border-violet-400/40  bg-violet-500/35',
  'Received payment':   'border-purple-400/40  bg-purple-700/35',
  Rented:               'border-blue-400/40    bg-blue-600/35',
  Sold:                 'border-brand-crimson/40 bg-brand-crimson/35',
}

// Soft chip for content area — supporting role only
const CHIP: Record<string, string> = {
  'Under Approval':    'bg-amber-50           text-amber-700      border-amber-200',
  Active:               'bg-brand-emerald-soft text-brand-emerald  border-brand-emerald/20',
  Inactive:             'bg-secondary          text-muted-foreground border-border/60',
  'Not Approved':       'bg-rose-50            text-rose-700       border-rose-200',
  'Under negotiation':  'bg-violet-50          text-violet-700     border-violet-200',
  'Received payment':   'bg-purple-50          text-purple-800     border-purple-200',
  Rented:               'bg-blue-50            text-blue-700       border-blue-200',
  Sold:                 'bg-brand-crimson-soft text-brand-crimson  border-brand-crimson/20',
}

const FALLBACK_OVERLAY_TINT = 'border-white/10 bg-black/40'
const FALLBACK_CHIP         = 'bg-secondary text-muted-foreground border-border/60'

interface PropertyStatusBadgeProps {
  status: string
  className?: string
  variant?: 'default' | 'overlay'
  /** Use short display labels (e.g. "Διαπραγμ." instead of "Υπό Διαπραγμάτευση")
   *  for width-constrained placements like the property card image badge.
   *  Presentation only — same `statusesCompact.*` i18n keys, full labels
   *  stay the default everywhere else. */
  compact?: boolean
}

export function PropertyStatusBadge({
  status,
  className,
  variant = 'default',
  compact = false,
}: PropertyStatusBadgeProps) {
  const { t } = useTranslation('properties')
  const dot   = STATUS_DOT_COLORS[status] ?? STATUS_DOT_FALLBACK
  const chip  = CHIP[status]         ?? FALLBACK_CHIP
  const tint  = OVERLAY_TINT[status] ?? FALLBACK_OVERLAY_TINT
  const label = getStatusLabel(status, t, { compact })

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
        {label}
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
      {label}
    </span>
  )
}
