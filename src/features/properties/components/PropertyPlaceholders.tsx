'use client'

import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DataCompleteness } from '../lib/data-completeness'

// ── PropertyImagePlaceholder ──────────────────────────────────────────────────
// Editorial no-photo state — replaces bare bg-muted when no image is available.
// Ruled texture + diagonal hatch give paper-plan character without distracting.

export function PropertyImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn(
      'relative flex items-center justify-center overflow-hidden bg-muted/30',
      className,
    )}>
      {/* Fine horizontal ruled texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 23px, currentColor 23px, currentColor 24px)',
        }}
      />
      {/* Diagonal hatch (60° to ruled — creates low-contrast grid feel) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: 'repeating-linear-gradient(60deg, transparent, transparent 18px, currentColor 18px, currentColor 19px)',
        }}
      />
      {/* Centre iconography */}
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <div className={cn(
          'flex size-12 items-center justify-center rounded-2xl',
          'border border-border/18 bg-card/70',
          'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        )}>
          <ImageOff className="size-5 text-muted-foreground/25" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/22">
          No photo available
        </span>
      </div>
    </div>
  )
}

// ── SectionPlaceholder ────────────────────────────────────────────────────────
// Used in PropertyDetailView when an entire section (description, specs) is
// absent. Renders a premium dashed editorial state rather than hiding the gap.

export function SectionPlaceholder({
  icon: Icon,
  label,
  hint,
  action,
  onAction,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  hint?: string
  action?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-4 rounded-[20px] px-8 py-12 text-center',
      'border border-dashed border-border/20 bg-muted/5',
      className,
    )}>
      {Icon && (
        <div className={cn(
          'flex size-11 items-center justify-center rounded-2xl',
          'border border-border/14 bg-card',
          'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
        )}>
          <Icon className="size-5 text-muted-foreground/22" />
        </div>
      )}
      <div>
        <p className="text-[13.5px] font-semibold text-foreground/55">{label}</p>
        {hint && (
          <p className="mt-1.5 max-w-[240px] text-[12px] leading-relaxed text-muted-foreground/38">
            {hint}
          </p>
        )}
      </div>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5',
            'border border-border/18 bg-card text-[11.5px] font-semibold text-foreground/45',
            'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
            'transition-colors hover:border-primary/28 hover:text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
        >
          {action}
        </button>
      )}
    </div>
  )
}

// ── CompletenessBar ───────────────────────────────────────────────────────────
// Progressive enhancement signal — shown in PropertyDetailView's sticky panel.
// Communicates listing quality at a glance and hints at what data is missing.
//
// Level → colour language (Compass / Sotheby's editorial palette):
//   minimal  → rose    — urgent: critical data absent
//   partial  → amber   — needs work: core present, supplemental missing
//   complete → emerald — all key fields populated
//   showcase → primary — photography + all fields, showcase-ready

const LEVEL = {
  minimal:  { track: 'bg-rose-400/70',    text: 'text-rose-500',    label: 'Incomplete' },
  partial:  { track: 'bg-amber-400/80',   text: 'text-amber-600',   label: 'Partial'    },
  complete: { track: 'bg-emerald-500/70', text: 'text-emerald-600', label: 'Complete'   },
  showcase: { track: 'bg-primary/80',     text: 'text-primary',     label: 'Showcase'   },
} as const

export function CompletenessBar({
  completeness,
  className,
}: {
  completeness: DataCompleteness
  className?: string
}) {
  const s = LEVEL[completeness.level]

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
          Listing Quality
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10.5px] font-bold', s.text)}>{s.label}</span>
          <span className="text-[10px] tabular-nums text-muted-foreground/50">
            {completeness.score}%
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-1 overflow-hidden rounded-full bg-muted/35">
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full',
            'transition-[width] duration-700 ease-out',
            s.track,
          )}
          style={{ width: `${completeness.score}%` }}
        />
      </div>

      {/* Missing field hint — shows up to 3 labels, then "+N more" */}
      {completeness.missing.length > 0 && (
        <p className="text-[10px] leading-relaxed text-muted-foreground/48">
          Missing:{' '}
          <span className="font-medium text-muted-foreground/60">
            {completeness.missing.slice(0, 3).join(', ')}
            {completeness.missing.length > 3 ? ` +${completeness.missing.length - 3}` : ''}
          </span>
        </p>
      )}
    </div>
  )
}
