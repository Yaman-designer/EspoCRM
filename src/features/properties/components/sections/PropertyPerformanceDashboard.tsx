'use client'

import {
  BedDouble, Bath, Maximize2, Car,
  TrendingUp, TrendingDown, Minus,
  BarChart3, GitBranch, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../../lib/display'
import { PIPELINE } from './PipelineTrack'
import { usePortfolioRanks } from '../../hooks/usePortfolioRanks'
import type { RealEstateProperty } from '../../types/property.types'
import type { PipelineStage } from './PipelineTrack'
import type { PropertyHealth, MarketDemand } from '../../lib/property-health'
import type { MetricRank, RankTier } from '../../lib/portfolio-analytics'

// ── Tier styles ───────────────────────────────────────────────────────────────

const TIER_BADGE: Record<RankTier, string> = {
  top:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  above:   'bg-primary/8 text-primary',
  average: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  below:   'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
}

const TIER_TEXT: Record<RankTier, string> = {
  top:     'text-emerald-700 dark:text-emerald-400',
  above:   'text-primary',
  average: 'text-amber-700 dark:text-amber-400',
  below:   'text-rose-600 dark:text-rose-400',
}

function TierIcon({ tier, className }: { tier: RankTier; className?: string }) {
  if (tier === 'top' || tier === 'above') return <TrendingUp className={className} />
  if (tier === 'below') return <TrendingDown className={className} />
  return <Minus className={className} />
}

function tierLabel(rank: MetricRank): string {
  if (rank.tier === 'top') {
    const pct = Math.max(1, 100 - rank.percentile)
    return `Top ${pct}%`
  }
  if (rank.tier === 'above')   return 'Above avg'
  if (rank.tier === 'average') return 'At average'
  return 'Below avg'
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────

interface TileProps {
  label:     string
  primary:   string
  secondary: string
  rank:      MetricRank | null
  loading:   boolean
  className?: string
}

function KpiTile({ label, primary, secondary, rank, loading, className }: TileProps) {
  return (
    <div className={cn('flex min-h-25 flex-col gap-1 px-5 py-4', className)}>
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
        {label}
      </p>

      {loading ? (
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-9 w-14 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted/22" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted/18" />
        </div>
      ) : (
        <>
          <p className="text-[36px] font-black leading-none tabular-nums tracking-tight text-foreground">
            {primary}
          </p>
          <p className="text-[11px] text-muted-foreground/58">{secondary}</p>
          {rank && (
            <span className={cn(
              'mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
              TIER_BADGE[rank.tier],
            )}>
              <TierIcon tier={rank.tier} className="size-2.5" />
              {tierLabel(rank)}
            </span>
          )}
        </>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertyPerformanceDashboardProps {
  property:      RealEstateProperty
  pipelineStage: PipelineStage
  health:        PropertyHealth
  demand:        MarketDemand
}

export function PropertyPerformanceDashboard({
  property,
  pipelineStage,
  health,
  demand,
}: PropertyPerformanceDashboardProps) {
  const { ranks, isLoading } = usePortfolioRanks(property)

  const {
    bedroomCount, bathroomCount, square, parkingCount,
    price, assignedUserName,
  } = property

  const pipelineLabel = PIPELINE.find(s => s.id === pipelineStage)?.label ?? ''
  const pricePerSqm   = price != null && square != null && square > 0
    ? Math.round(price / square)
    : null

  const priceVsAvgPct = ranks?.avgPricePerSqm != null && pricePerSqm != null
    ? Math.round(((pricePerSqm - ranks.avgPricePerSqm) / ranks.avgPricePerSqm) * 100)
    : null

  const hasSpecs = bedroomCount != null || bathroomCount != null || square != null || parkingCount != null

  return (
    <div className="mt-4 px-8">
      <div className={cn(
        'overflow-hidden rounded-[24px] bg-card',
        'border border-border/22',
        'shadow-[0_1px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]',
      )}>
        {/* Accent line — primary tint */}
        <div className="h-px bg-linear-to-r from-primary/35 via-primary/12 to-transparent" />

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-3.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-3.5 text-primary/65" strokeWidth={2} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">
              Portfolio Analytics
            </p>
          </div>

          {/* Compact specs */}
          {hasSpecs && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {bedroomCount != null && (
                <div className="flex items-center gap-1.5">
                  <BedDouble className="size-3 shrink-0 text-muted-foreground/42" />
                  <span className="text-[11.5px] font-semibold tabular-nums text-foreground/80">
                    {bedroomCount}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground/50">Beds</span>
                </div>
              )}
              {bathroomCount != null && (
                <div className="flex items-center gap-1.5">
                  <Bath className="size-3 shrink-0 text-muted-foreground/42" />
                  <span className="text-[11.5px] font-semibold tabular-nums text-foreground/80">
                    {bathroomCount}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground/50">Baths</span>
                </div>
              )}
              {square != null && (
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="size-3 shrink-0 text-muted-foreground/42" />
                  <span className="text-[11.5px] font-semibold tabular-nums text-foreground/80">
                    {square.toLocaleString()}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground/50">m²</span>
                </div>
              )}
              {parkingCount != null && (
                <div className="flex items-center gap-1.5">
                  <Car className="size-3 shrink-0 text-muted-foreground/42" />
                  <span className="text-[11.5px] font-semibold tabular-nums text-foreground/80">
                    {parkingCount}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground/50">PKG</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4 KPI tiles ── */}
        <div className="grid grid-cols-2 border-t border-border/10 sm:grid-cols-4">

          {/* Tile 1 — Portfolio Rank */}
          <KpiTile
            label="Portfolio Rank"
            primary={ranks ? `#${ranks.overall.position}` : '—'}
            secondary={ranks ? `of ${ranks.total} active listings` : 'Calculating…'}
            rank={ranks?.overall ?? null}
            loading={isLoading}
            className="border-b border-r border-border/10 sm:border-b-0"
          />

          {/* Tile 2 — Demand Rank */}
          <KpiTile
            label="Demand Rank"
            primary={ranks ? `#${ranks.demand.position}` : '—'}
            secondary={ranks ? `of ${ranks.total} · ${demand.label}` : 'Calculating…'}
            rank={ranks?.demand ?? null}
            loading={isLoading}
            className="border-b border-border/10 sm:border-b-0 sm:border-r"
          />

          {/* Tile 3 — Health Score */}
          <KpiTile
            label="Health Score"
            primary={String(health.score)}
            secondary={`/ 100 · Grade ${health.grade} · ${health.label}`}
            rank={ranks?.health ?? null}
            loading={isLoading}
            className="border-r border-border/10"
          />

          {/* Tile 4 — Completion Rank */}
          <KpiTile
            label="Completion Rank"
            primary={ranks ? `#${ranks.completion.position}` : '—'}
            secondary={ranks ? `of ${ranks.total} · ${ranks.completion.deltaLabel} avg` : 'Calculating…'}
            rank={ranks?.completion ?? null}
            loading={isLoading}
          />

        </div>

        {/* ── Comparison footer ── */}
        <div className={cn(
          'flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/10 px-6 py-3',
          'bg-muted/[0.03]',
        )}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/45">
            vs. Portfolio avg
          </span>

          {ranks && (
            <>
              <ComparisonChip
                label="Health"
                delta={ranks.health.delta}
                unit="pts"
              />
              <ComparisonChip
                label="Demand"
                delta={ranks.demand.delta}
                unit="pts"
              />
              {priceVsAvgPct != null && (
                <ComparisonChip
                  label="Price/m²"
                  delta={priceVsAvgPct}
                  unit="%"
                />
              )}
              <span className="ml-auto text-[10.5px] text-muted-foreground/45">
                {ranks.total} listings in portfolio
              </span>
            </>
          )}

          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-20 animate-pulse rounded bg-muted/22" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted/18" />
            </div>
          )}

          {/* Pipeline + agent context */}
          <div className="flex w-full items-center gap-4 border-t border-border/8 pt-2.5 sm:w-auto sm:border-t-0 sm:pt-0 sm:ml-auto">
            <div className="flex items-center gap-1.5">
              <GitBranch className="size-3 shrink-0 text-muted-foreground/42" />
              <span className="text-[10.5px] text-muted-foreground/55">Stage</span>
              <span className="rounded-full bg-primary/10 px-2 py-px text-[10.5px] font-bold text-primary">
                {pipelineLabel}
              </span>
            </div>
            {assignedUserName && (
              <div className="flex items-center gap-1.5">
                <User className="size-3 shrink-0 text-muted-foreground/42" />
                <span className="text-[10.5px] font-semibold text-foreground/70">{assignedUserName}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Comparison chip ───────────────────────────────────────────────────────────

function ComparisonChip({ label, delta, unit }: { label: string; delta: number; unit: string }) {
  const positive   = delta >= 0
  const sign       = positive ? '+' : '−'
  const colorClass = positive ? TIER_TEXT.above : TIER_TEXT.below
  const absVal     = Math.round(Math.abs(delta))
  if (absVal === 0) return null

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground/50">{label}</span>
      <span className={cn('text-[10.5px] font-bold tabular-nums', colorClass)}>
        {sign}{absVal}{unit}
      </span>
    </div>
  )
}
