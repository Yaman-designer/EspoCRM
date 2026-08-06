'use client'

import type { ComponentType, ReactNode } from 'react'
import { Check, ChevronRight, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Review-page presentation primitives ─────────────────────────────────────
// Reusable, read-only building blocks for Step 08 (Review & Publish). Every
// visual choice here is lifted directly from the chrome already established
// across Steps 01-07 — SectionRenderer's default card (radius, border,
// shadow, icon chip, completion badge), section-primitives.tsx's
// SectionCompletionBadge/chip treatment — so Review reads as the same
// product's final chapter, not a new visual language. None of these render
// a form control: they only display already-collected values.

/* ── ReviewCard ──────────────────────────────────────────────────────────
   Same "premium white elevated card" chrome as SectionRenderer's default
   (non-collapsible, non-tinted) section — see SectionRenderer.tsx's Path C.
   Adds an optional completion badge and an Edit action in the header, both
   using the exact same visual language as SectionCompletionBadge. */

interface ReviewCardProps {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  completion?: { filled: number; total: number }
  onEdit?: () => void
  editLabel?: string
  headerAddon?: ReactNode
  children: ReactNode
  className?: string
  /**
   * Visual-rhythm device, not a new component: 'strong' nudges the icon
   * chip and title up one notch (still the exact same chip/typography
   * scale this file already uses elsewhere, just its more-emphasized
   * point on it) so the wizard's two most commercially-defining review
   * cards (what the property is, what it costs) read as the chapter
   * openers they are, instead of every card carrying identical weight.
   * Default unchanged from before this pass.
   */
  emphasis?: 'default' | 'strong'
}

export function ReviewCard({
  icon: Icon, title, description, completion, onEdit, editLabel = 'Edit', headerAddon, children, className,
  emphasis = 'default',
}: ReviewCardProps) {
  const isComplete = !!completion && completion.total > 0 && completion.filled >= completion.total
  const isStrong = emphasis === 'strong'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border border-border/30 bg-card',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_3px_16px_rgba(16,24,40,0.05)]',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        'hover:border-border/45',
        'hover:shadow-[0_2px_6px_rgba(16,24,40,0.06),0_8px_28px_rgba(16,24,40,0.08)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10',
                isStrong ? 'bg-primary/12 text-primary ring-1 ring-primary/15' : 'bg-primary/8 text-primary ring-1 ring-primary/10',
              )}
              aria-hidden
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
          <div className="min-w-0 space-y-1 pt-1">
            <h3 className={cn('font-bold tracking-tight text-foreground', isStrong ? 'text-[16px]' : 'text-[15px]')}>
              {title}
            </h3>
            {description && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground/60">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          {headerAddon}

          {completion && completion.total > 0 && (
            <span
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums transition-colors duration-200',
                isComplete
                  ? 'bg-brand-emerald-soft/40 text-brand-emerald'
                  : 'bg-muted/60 text-muted-foreground/55',
              )}
            >
              {isComplete && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
              {completion.filled}/{completion.total}
            </span>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                'flex h-7 shrink-0 items-center gap-1 rounded-lg border border-border/40 px-2.5',
                'text-[11.5px] font-semibold text-muted-foreground/70',
                'transition-colors duration-200 hover:border-border/70 hover:bg-muted/50 hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              aria-label={`${editLabel} ${title}`}
            >
              <Pencil className="h-3 w-3" aria-hidden />
              {editLabel}
            </button>
          )}
        </div>
      </div>

      <div className="mx-5 border-b border-border/20 sm:mx-6" />

      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        {children}
      </div>
    </div>
  )
}

/* ── KeyValueRow ─────────────────────────────────────────────────────────
   Read-only fact, dossier-style: the value reads first and largest — "the
   fact" — with its caption quietly underneath, the same reading order a
   property brochure or spec sheet uses ("€350,000" / "Asking Price"), not
   a form's label-above-input order. `weight` still drives the "Primary /
   Secondary / Muted" typographic tiers — primary facts (price, area,
   region) read large and bold, secondary facts smaller, optional facts
   quieter still, so commercial information dominates and metadata never
   competes with it. An absent value renders a quiet "Not set" rather than
   a blank gap. `label` is optional — a handful of already self-descriptive
   facts (e.g. "3 Bedrooms") read as a complete phrase on their own; forcing
   a redundant "Bedrooms" caption under them would repeat, not clarify. */

export type KeyValueWeight = 'primary' | 'secondary' | 'muted'

const VALUE_CLS: Record<KeyValueWeight, string> = {
  primary: 'text-[19px] font-extrabold tracking-tight text-foreground',
  secondary: 'text-[13.5px] font-semibold text-foreground/85',
  muted: 'text-[11.5px] font-medium text-muted-foreground/55',
}

export function KeyValueRow({
  label, value, weight = 'secondary', className,
}: {
  label?: string
  value?: ReactNode
  weight?: KeyValueWeight
  className?: string
}) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className={cn(VALUE_CLS[weight], 'truncate')}>
        {value !== undefined && value !== null && value !== '' ? value : (
          <span className="text-muted-foreground/35">Not set</span>
        )}
      </p>
      {label && (
        <p className="truncate text-[11px] font-medium text-muted-foreground/50">
          {label}
        </p>
      )}
    </div>
  )
}

/* ── Chip ────────────────────────────────────────────────────────────────
   Same rounded-lg/border/muted chip already used by the current Review
   step's SummaryList items — promoted here so every read-only tag in the
   page (status, category, feature flags) shares one implementation. */

export function Chip({
  children, tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'positive' | 'warning'
}) {
  const toneCls =
    tone === 'positive' ? 'border-brand-emerald/20 bg-brand-emerald-soft/30 text-brand-emerald' :
    tone === 'warning' ? 'border-amber-200 bg-amber-100/70 text-amber-700' :
    'border-border/30 bg-muted/50 text-muted-foreground/80'

  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold', toneCls)}>
      {children}
    </span>
  )
}

/* ── MetricBlock ─────────────────────────────────────────────────────────
   Big-number treatment matching the wizard's existing score-card style
   (same size/weight as the prior ReviewStep's ScoreCard). `size="sm"` is
   the same block at a deliberately quieter scale — used in the Publish
   Decision card, where the score numbers are now supporting detail
   underneath the ConfidenceItem checklist (the actual "can I publish?"
   answer), not the card's headline message. */

export function MetricBlock({
  label, value, suffix, tone = 'neutral', size = 'lg',
}: {
  label: string
  value: ReactNode
  suffix?: string
  tone?: 'neutral' | 'positive' | 'warning' | 'destructive'
  size?: 'lg' | 'sm'
}) {
  const valueCls =
    tone === 'positive' ? 'text-brand-emerald' :
    tone === 'warning' ? 'text-amber-600' :
    tone === 'destructive' ? 'text-destructive' :
    'text-foreground'

  return (
    <div className="min-w-0">
      <p className={cn(
        'font-semibold uppercase tracking-widest text-muted-foreground/55',
        size === 'lg' ? 'text-[11px]' : 'text-[10px]',
      )}>
        {label}
      </p>
      <div className={cn('flex items-baseline gap-1.5', size === 'lg' ? 'mt-1.5' : 'mt-1')}>
        <span className={cn(
          'font-bold leading-none tracking-tight',
          size === 'lg' ? 'text-[28px]' : 'text-[18px]',
          valueCls,
        )}>
          {value}
        </span>
        {suffix && (
          <span className={cn('text-muted-foreground/50', size === 'lg' ? 'text-[13px]' : 'text-[11px]')}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── ConfidenceItem ──────────────────────────────────────────────────────
   The Publish Decision zone's primary message: a pass/fail confirmation
   ("Listing Complete", "Validation Passed"...), visually stronger than the
   score numbers beneath it — reusing the same check/alert-tone language
   already established by the Quality Center's "ready to publish" banner
   and QualityIssueGroup, not a new visual idiom. */

export function ConfidenceItem({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          pass ? 'bg-brand-emerald-soft/50 text-brand-emerald' : 'bg-muted text-muted-foreground/60',
        )}
        aria-hidden
      >
        {pass ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className={cn('text-[13.5px] font-semibold', pass ? 'text-foreground' : 'text-muted-foreground/70')}>
        {label}
      </span>
    </div>
  )
}

/* ── QualityIssueRow ─────────────────────────────────────────────────────
   One actionable line in the Quality Center — replaces the old flat
   warning-banner chip list with a row that states the gap and links
   straight to the step that fixes it, per the brief's "Missing Photos →
   Edit Marketing" pattern. */

export function QualityIssueRow({
  label, stepLabel, onClick,
}: {
  label: string
  stepLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-xl border border-border/25 bg-card px-3.5 py-2.5 text-left',
        'transition-colors duration-200 hover:border-border/45 hover:bg-muted/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span className="min-w-0 truncate text-[12.5px] font-medium text-foreground/80">{label}</span>
      <span className="flex shrink-0 items-center gap-0.5 text-[11.5px] font-semibold text-primary/80 transition-colors group-hover:text-primary">
        Edit {stepLabel}
        <ChevronRight className="h-3 w-3" aria-hidden />
      </span>
    </button>
  )
}

/* ── QualityIssueGroup ───────────────────────────────────────────────────
   A titled cluster of QualityIssueRows (Missing Information / Required
   Fields / Needs Attention) — the compact enterprise-card replacement for
   the old full-width warning banner. */

export function QualityIssueGroup({
  icon: Icon, tone, title, count, children,
}: {
  icon: ComponentType<{ className?: string }>
  tone: 'warning' | 'destructive' | 'neutral'
  title: string
  count: number
  children: ReactNode
}) {
  const chipCls =
    tone === 'warning' ? 'border-amber-200 bg-amber-100/70 text-amber-600' :
    tone === 'destructive' ? 'border-destructive/20 bg-destructive/8 text-destructive' :
    'border-border/40 bg-muted text-muted-foreground'

  return (
    <div className="rounded-2xl border border-border/30 bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', chipCls)} aria-hidden>
          <Icon className="size-4 shrink-0" />
        </div>
        <p className="text-[13px] font-bold tracking-tight text-foreground">{title}</p>
        <span className="ml-auto shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground/50">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {children}
      </div>
    </div>
  )
}
