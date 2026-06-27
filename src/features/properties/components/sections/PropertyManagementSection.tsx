import { User, Phone, Mail, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtDate } from '../../lib/display'
import { PipelineTrack } from './PipelineTrack'
import type { PipelineStage } from './PipelineTrack'
import type { RealEstateProperty } from '../../types/property.types'
import type { MarketDemand, NextAction } from '../../lib/property-health'

// ── Style maps ────────────────────────────────────────────────────────────────

const DEMAND_BADGE: Record<string, string> = {
  'very-high': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  'high':      'bg-primary/8 text-primary',
  'medium':    'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  'low':       'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-rose-500',
  high:   'bg-amber-400',
  medium: 'bg-primary/70',
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
  high:   'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  medium: 'bg-primary/8 text-primary',
}

const CARD = cn(
  'rounded-2xl bg-card',
  'border border-border/50',
  'shadow-design-md',
)

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertyManagementSectionProps {
  property:             RealEstateProperty
  pipelineStage:        PipelineStage
  currentPipelineLabel: string
  demand:               MarketDemand
  actions:              NextAction[]
  onDelete:             () => void
}

export function PropertyManagementSection({
  property,
  pipelineStage,
  currentPipelineLabel,
  demand,
  actions,
  onDelete,
}: PropertyManagementSectionProps) {
  const { assignedUserName, createdAt } = property

  return (
    <div className={cn(CARD, 'p-5')}>

      {/* ── Pipeline header ── */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
            Deal Pipeline
          </p>
          <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
            {currentPipelineLabel}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="size-2 rounded-full bg-primary/80" />
          <span className="text-[11px] font-medium text-muted-foreground/65">Active</span>
        </div>
      </div>

      {/* ── Pipeline track ── */}
      <div className="mb-5 rounded-xl border border-border/14 bg-muted/12 px-4 py-4">
        <PipelineTrack current={pipelineStage} />
      </div>

      {/* ── Assigned Agent ── */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
          Assigned Agent
        </p>
        {assignedUserName ? (
          <div className="flex items-center gap-4 rounded-xl border border-border/18 bg-muted/8 p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground/7">
              <span className="text-[18px] font-semibold leading-none text-foreground/55">
                {assignedUserName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight text-foreground">{assignedUserName}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground/62">Real Estate Agent</p>
              {createdAt && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/45">Since {fmtDate(createdAt)}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label="Call agent"
                className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/18 focus-visible:outline-none"
              >
                <Phone className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Email agent"
                className="flex size-9 items-center justify-center rounded-full border border-border/25 bg-card text-foreground/55 transition-colors hover:border-border/45 hover:text-foreground focus-visible:outline-none"
              >
                <Mail className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[16px] border border-dashed border-border/30 bg-muted/8 px-4 py-3.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/22 bg-card">
              <User className="size-3.5 text-muted-foreground/40" />
            </div>
            <p className="text-[12.5px] text-muted-foreground/52">No agent assigned</p>
          </div>
        )}
      </div>

      {/* ── Market Demand ── */}
      <div className="mt-5 border-t border-border/10 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
            Market Demand
          </p>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[10.5px] font-bold', DEMAND_BADGE[demand.level])}>
            {demand.label}
          </span>
        </div>
        {demand.signals.length > 0 ? (
          <div className="space-y-1">
            {demand.signals.slice(0, 3).map(signal => (
              <div key={signal.id} className="flex items-start gap-2.5 py-1.5 border-b border-border/8 last:border-0">
                <div className={cn(
                  'mt-1.25 size-1.5 shrink-0 rounded-full',
                  signal.positive ? 'bg-emerald-500/70' : 'bg-amber-400/70',
                )} />
                <p className="text-[12px] text-foreground/65">{signal.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] italic text-muted-foreground/45">No strong demand signals detected</p>
        )}
      </div>

      {/* ── Recommended Actions ── */}
      {actions.length > 0 && (
        <div className="mt-5 border-t border-border/10 pt-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
            Recommended Actions
          </p>
          <div className="space-y-2.5">
            {actions.map(action => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-xl border border-border/12 bg-muted/6 px-3.5 py-3"
              >
                <div className={cn('mt-1 size-2 shrink-0 rounded-full', PRIORITY_DOT[action.priority])} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[12.5px] font-semibold leading-tight text-foreground">{action.action}</p>
                    <span className={cn('shrink-0 rounded-full px-2 py-px text-[9.5px] font-bold', PRIORITY_LABEL[action.priority])}>
                      {action.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/58">{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delete ── */}
      <div className="mt-4 border-t border-border/10 pt-4">
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'flex h-8 w-full items-center justify-center gap-2 rounded-2xl',
            'border border-destructive/14 bg-transparent text-[11.5px] font-semibold text-destructive/45',
            'transition-colors hover:border-destructive/28 hover:bg-destructive/5 hover:text-destructive',
            'focus-visible:outline-none',
          )}
        >
          <Trash2 className="size-3.5" />
          Delete Property
        </button>
      </div>

    </div>
  )
}
