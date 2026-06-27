'use client'

import { Heart, Share2, Printer, MapPin, BedDouble, Bath, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../lib/display'
import type { RealEstateProperty } from '../types/property.types'
import type { PropertyHealth, MarketDemand, LeadQuality, HealthGrade } from '../lib/property-health'

// ── Light-surface chip palette (matches dashboard token system) ───────────────

const STATUS_DOT: Record<string, string> = {
  Available:        'bg-[#12B76A]',
  Reserved:         'bg-[#F79009]',
  Pending:          'bg-[#F79009]',
  'Under Approval': 'bg-[#F79009]',
  Sold:             'bg-[#F04438]',
  Rented:           'bg-[#F04438]',
  Draft:            'bg-muted-foreground/35',
}

const STATUS_CHIP: Record<string, string> = {
  Available:        'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/20',
  Reserved:         'bg-[#F79009]/10 text-[#F79009] border-[#F79009]/20',
  Pending:          'bg-[#F79009]/10 text-[#F79009] border-[#F79009]/20',
  'Under Approval': 'bg-[#F79009]/10 text-[#F79009] border-[#F79009]/20',
  Sold:             'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/20',
  Rented:           'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/20',
  Draft:            'bg-muted text-muted-foreground border-border/50',
}

const HEALTH_CHIP: Record<HealthGrade, string> = {
  A: 'bg-primary/10 text-primary border-primary/18',
  B: 'bg-primary/8 text-primary border-primary/14',
  C: 'bg-[#F79009]/10 text-[#F79009] border-[#F79009]/18',
  D: 'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/18',
}

const DEMAND_CHIP: Record<string, string> = {
  'very-high': 'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/18',
  'high':      'bg-primary/10 text-primary border-primary/18',
  'medium':    'bg-[#F79009]/10 text-[#F79009] border-[#F79009]/18',
  'low':       'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/18',
}

const LEAD_CHIP: Record<string, string> = {
  hot:  'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/18',
  warm: 'bg-[#F79009]/10 text-[#F79009] border-[#F79009]/18',
  cold: 'bg-muted text-muted-foreground border-border/40',
}

const CHIP = cn(
  'inline-flex items-center gap-1.5 rounded-full border',
  'px-2.5 py-[3.5px] text-[10px] font-semibold tracking-wide',
)

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertyCommandHeaderProps {
  property:         RealEstateProperty
  displayName?:     string | null
  displayLocation?: string | null
  pipelineLabel:    string
  health:           PropertyHealth
  demand:           MarketDemand
  leadQuality:      LeadQuality
  favorited:        boolean
  onToggleFav?:     () => void
  onShare?:         () => void
  onPrint?:         () => void
}

export function PropertyCommandHeader({
  property,
  displayName,
  displayLocation,
  pipelineLabel,
  health,
  demand,
  leadQuality,
  favorited,
  onToggleFav,
  onShare,
  onPrint,
}: PropertyCommandHeaderProps) {
  const { status, type, price, bedroomCount, bathroomCount, square } = property

  return (
    <div className="mt-5 px-8">
      <div className={cn(
        'overflow-hidden rounded-2xl bg-card',
        'border border-border/50',
        'shadow-design-md',
      )}>

        {/* ── Main identity — title + price + actions ── */}
        <div className="flex items-start gap-6 px-7 pt-6 pb-5">

          <div className="min-w-0 flex-1">

            {/* Eyebrow — type · code */}
            {(type || property.propertyCode) && (
              <div className="mb-2 flex items-center gap-2">
                {type && (
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {type}
                  </span>
                )}
                {property.propertyCode && (
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/50">
                    · #{property.propertyCode}
                  </span>
                )}
              </div>
            )}

            {/* Level 1 — Property Title */}
            <h1 className={cn(
              'font-bold tracking-tight text-foreground leading-[1.06]',
              'text-[24px] sm:text-[30px] lg:text-[36px]',
              'mb-3 text-balance',
            )}>
              {displayName || 'Unnamed Property'}
            </h1>

            {/* Level 2 — Price */}
            {price != null && (
              <div className="flex items-baseline gap-2.5">
                <p className={cn(
                  'font-bold tabular-nums tracking-tight text-foreground',
                  'text-[20px] sm:text-[24px] lg:text-[28px]',
                )}>
                  {fmtPrice(price)}
                </p>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Asking Price
                </span>
              </div>
            )}

          </div>

          {/* Action cluster */}
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {onToggleFav && (
              <button
                type="button"
                aria-label={favorited ? 'Remove from favourites' : 'Save property'}
                onClick={onToggleFav}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150',
                  'focus-visible:outline-none',
                  favorited
                    ? 'bg-rose-500 text-white shadow-[0_2px_10px_rgba(239,68,68,0.25)]'
                    : 'border border-border/50 bg-card text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <Heart className={cn('size-4', favorited ? 'fill-current' : 'fill-transparent')} />
              </button>
            )}
            {onShare && (
              <button
                type="button"
                aria-label="Share property"
                onClick={onShare}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card text-muted-foreground transition-all hover:border-border hover:text-foreground focus-visible:outline-none"
              >
                <Share2 className="size-4" />
              </button>
            )}
            {onPrint && (
              <button
                type="button"
                aria-label="Print property"
                onClick={onPrint}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card text-muted-foreground transition-all hover:border-border hover:text-foreground focus-visible:outline-none"
              >
                <Printer className="size-4" />
              </button>
            )}
          </div>

        </div>

        {/* ── Intelligence + metadata strip ── */}
        <div className={cn(
          'border-t border-border/40 bg-muted/25',
          'flex flex-col gap-3 px-7 py-3.5',
          'sm:flex-row sm:items-center sm:justify-between',
        )}>

          {/* Level 3 — CRM intelligence chips */}
          <div className="flex flex-wrap items-center gap-1.5">

            {status && (
              <span className={cn(CHIP, STATUS_CHIP[status] ?? 'bg-muted text-muted-foreground border-border/50')}>
                <span className={cn('size-1.5 rounded-full', STATUS_DOT[status] ?? 'bg-muted-foreground/35')} />
                {status}
              </span>
            )}

            <span className={cn(CHIP, 'bg-muted text-muted-foreground border-border/50')}>
              {pipelineLabel}
            </span>

            <span className={cn(CHIP, HEALTH_CHIP[health.grade])}>
              <span className="size-1.5 rounded-full bg-current" />
              Grade {health.grade}
            </span>

            <span className={cn(CHIP, DEMAND_CHIP[demand.level] ?? 'bg-muted text-muted-foreground border-border/50')}>
              {demand.label}
            </span>

            <span className={cn(CHIP, LEAD_CHIP[leadQuality.tier] ?? 'bg-muted text-muted-foreground border-border/50')}>
              {leadQuality.label}
            </span>

          </div>

          {/* Level 4 — Location + specs */}
          {(displayLocation || bedroomCount != null || bathroomCount != null || square != null) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:shrink-0">
              {displayLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0 text-muted-foreground/55" />
                  <span className="text-[11.5px] text-muted-foreground">{displayLocation}</span>
                </div>
              )}
              {bedroomCount != null && (
                <div className="flex items-center gap-1.5">
                  <BedDouble className="size-3 shrink-0 text-muted-foreground/50" />
                  <span className="text-[11.5px] text-muted-foreground">{bedroomCount} Beds</span>
                </div>
              )}
              {bathroomCount != null && (
                <div className="flex items-center gap-1.5">
                  <Bath className="size-3 shrink-0 text-muted-foreground/50" />
                  <span className="text-[11.5px] text-muted-foreground">{bathroomCount} Baths</span>
                </div>
              )}
              {square != null && (
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="size-3 shrink-0 text-muted-foreground/50" />
                  <span className="text-[11.5px] text-muted-foreground">{square.toLocaleString()} m²</span>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
