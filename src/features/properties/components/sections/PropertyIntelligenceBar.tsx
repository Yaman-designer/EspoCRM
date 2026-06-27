import { BedDouble, Bath, Maximize2, Car, User, TrendingUp, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../../lib/display'
import { PIPELINE } from './PipelineTrack'
import type { RealEstateProperty } from '../../types/property.types'
import type { PipelineStage } from './PipelineTrack'
import type { PropertyHealth, MarketDemand } from '../../lib/property-health'

// ── Style maps ────────────────────────────────────────────────────────────────

const GRADE_BADGE: Record<string, string> = {
  A: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  B: 'bg-primary/8 text-primary',
  C: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  D: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
}

const DEMAND_BADGE: Record<string, string> = {
  'very-high': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  'high':      'bg-primary/8 text-primary',
  'medium':    'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  'low':       'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertyIntelligenceBarProps {
  property:      RealEstateProperty
  pipelineStage: PipelineStage
  health:        PropertyHealth
  demand:        MarketDemand
}

export function PropertyIntelligenceBar({
  property,
  pipelineStage,
  health,
  demand,
}: PropertyIntelligenceBarProps) {
  const { bedroomCount, bathroomCount, square, parkingCount, assignedUserName, price } = property

  const pipelineLabel = PIPELINE.find(s => s.id === pipelineStage)?.label ?? ''
  const pricePerSqm   = price != null && square != null ? Math.round(price / square) : null
  const hasSpecs      = bedroomCount != null || bathroomCount != null || square != null || parkingCount != null

  return (
    <div className="mt-5 px-8">
      <div className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-card sm:flex-row',
        'border border-border/20',
        'shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.05)]',
      )}>

        {/* Zone A — physical specs */}
        {hasSpecs && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 px-5 py-3.5 sm:flex-nowrap">
            {bedroomCount != null && (
              <div className="flex items-center gap-1.5">
                <BedDouble className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[13px] font-bold tabular-nums text-foreground">{bedroomCount}</span>
                <span className="text-[11px] text-muted-foreground/58">Beds</span>
              </div>
            )}
            {bathroomCount != null && (
              <div className="flex items-center gap-1.5">
                <Bath className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[13px] font-bold tabular-nums text-foreground">{bathroomCount}</span>
                <span className="text-[11px] text-muted-foreground/58">Baths</span>
              </div>
            )}
            {square != null && (
              <div className="flex items-center gap-1.5">
                <Maximize2 className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[13px] font-bold tabular-nums text-foreground">{square.toLocaleString()}</span>
                <span className="text-[11px] text-muted-foreground/58">m²</span>
              </div>
            )}
            {parkingCount != null && (
              <div className="flex items-center gap-1.5">
                <Car className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[13px] font-bold tabular-nums text-foreground">{parkingCount}</span>
                <span className="text-[11px] text-muted-foreground/58">Parking</span>
              </div>
            )}
            {pricePerSqm != null && (
              <>
                <div className="hidden h-3.5 w-px bg-border/20 sm:block" />
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="text-[13px] font-bold tabular-nums text-foreground">{fmtPrice(pricePerSqm)}</span>
                  <span className="text-[11px] text-muted-foreground/58">/m²</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Vertical separator — desktop only */}
        {hasSpecs && (
          <div className="hidden w-px shrink-0 bg-border/14 sm:block" />
        )}

        {/* Zone B — CRM intelligence */}
        <div className={cn(
          'flex flex-wrap items-center gap-x-5 gap-y-2.5 px-5 py-3.5 sm:flex-nowrap',
          hasSpecs && 'border-t border-border/10 sm:border-t-0',
        )}>

          {/* Pipeline stage */}
          <div className="flex items-center gap-2">
            <GitBranch className="size-3.5 shrink-0 text-muted-foreground/50" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
              Stage
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {pipelineLabel}
            </span>
          </div>

          {/* Agent */}
          {assignedUserName && (
            <>
              <div className="hidden h-3.5 w-px bg-border/20 sm:block" />
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[12px] font-semibold text-foreground/80">{assignedUserName}</span>
              </div>
            </>
          )}

          {/* Health grade */}
          <div className="hidden h-3.5 w-px bg-border/20 sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
              Health
            </span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', GRADE_BADGE[health.grade])}>
              {health.grade} · {health.label}
            </span>
          </div>

          {/* Market demand */}
          <div className="hidden h-3.5 w-px bg-border/20 sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
              Demand
            </span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', DEMAND_BADGE[demand.level])}>
              {demand.label}
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
