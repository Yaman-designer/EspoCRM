import {
  MapPin, Navigation, Copy,
  User, Home, CalendarDays, Clock,
  Phone, Calendar, Plus,
  Pencil, Heart, Share2, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtPrice, fmtDate } from '../../lib/display'
import type { PropertyIntelligence } from '../../lib/property-intelligence'
import type { PropertyNarrative } from '../../lib/property-narrative'
import type { PropertyHealth, MarketDemand, LeadQuality, NextAction } from '../../lib/property-health'
import type { RealEstateProperty } from '../../types/property.types'

// ── Style maps ────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  hot:  'bg-rose-500 text-white',
  warm: 'bg-amber-500 text-white',
  cold: 'bg-muted/40 text-muted-foreground/70',
}

const TIER_DOT: Record<string, string> = {
  hot:  'bg-white/80',
  warm: 'bg-white/80',
  cold: 'bg-muted-foreground/40',
}

const GRADE_BG: Record<string, string> = {
  A: 'bg-emerald-50 dark:bg-emerald-950/30',
  B: 'bg-primary/8',
  C: 'bg-amber-50 dark:bg-amber-950/30',
  D: 'bg-rose-50 dark:bg-rose-950/30',
}

const GRADE_TEXT: Record<string, string> = {
  A: 'text-emerald-700 dark:text-emerald-400',
  B: 'text-primary',
  C: 'text-amber-700 dark:text-amber-400',
  D: 'text-rose-600 dark:text-rose-400',
}

const GRADE_TRACK: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-primary',
  C: 'bg-amber-400',
  D: 'bg-rose-400',
}

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

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertySidePanelProps {
  property:        RealEstateProperty
  displayLocation: string
  intelligence:    PropertyIntelligence
  narrative:       PropertyNarrative
  health:          PropertyHealth
  demand:          MarketDemand
  leadQuality:     LeadQuality
  actions:         NextAction[]
  favorited:       boolean
  addressCopied:   boolean
  mapsUrl:         string
  onToggleFav:     () => void
  onShare:         () => void
  onPrint:         () => void
  onCopyAddress:   () => void
  onEdit:          () => void
}

export function PropertySidePanel({
  property,
  displayLocation,
  intelligence,
  narrative,
  health,
  demand,
  leadQuality,
  actions,
  favorited,
  addressCopied,
  mapsUrl,
  onToggleFav,
  onShare,
  onPrint,
  onCopyAddress,
  onEdit,
}: PropertySidePanelProps) {
  const {
    price, status, type, propertyCode,
    purpose, assignedUserName, createdAt, modifiedAt,
  } = property

  return (
    <div className="order-first min-w-0 lg:order-last lg:col-span-4 lg:sticky lg:top-6">
      <div className={cn(
        'rounded-3xl bg-card',
        'border border-border/25',
        'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.09),0_28px_72px_rgba(0,0,0,0.12)]',
        'overflow-hidden',
      )}>
        <div className="h-px bg-linear-to-r from-foreground/22 via-foreground/10 to-transparent" />

        <div className="p-5">

          {/* ── Lead quality + Price block ── */}
          <div className="mb-4 border-b border-border/12 pb-4">

            {/* Tier badge */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold',
                TIER_BADGE[leadQuality.tier],
              )}>
                <span className={cn('size-1.5 shrink-0 rounded-full', TIER_DOT[leadQuality.tier])} />
                {leadQuality.label}
              </span>
              <span className="max-w-37.5 text-right text-[10px] leading-snug text-muted-foreground/55">
                {leadQuality.reason}
              </span>
            </div>

            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              Asking Price
            </p>
            {price != null ? (
              <>
                <p className="text-[32px] font-black leading-none tabular-nums tracking-tight text-foreground">
                  {fmtPrice(price)}
                </p>
                {intelligence.investmentSignals.length > 0 && (
                  <>
                    <div className="my-3 h-px bg-border/12" />
                    <div className="space-y-1">
                      {intelligence.investmentSignals.map(signal => (
                        <p key={signal.id} className="text-[11.5px] text-muted-foreground/65">
                          {signal.label}:{' '}
                          <span className="font-semibold text-foreground/80">{signal.value}</span>
                          {signal.note && (
                            <span className="text-muted-foreground/50"> · {signal.note}</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-[15px] italic text-muted-foreground/55">Price on request</p>
            )}
          </div>

          {/* ── Primary CTAs ── */}
          <div className="mb-4 space-y-2 border-b border-border/12 pb-4">
            <button
              type="button"
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl',
                'bg-foreground text-[10.5px] font-semibold uppercase tracking-widest text-background',
                'shadow-[0_2px_16px_rgba(0,0,0,0.16)]',
                'transition-opacity duration-150 hover:opacity-88',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              <Phone className="size-3.5" />
              Request Viewing
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                className={cn(
                  'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl',
                  'border border-border/30 bg-transparent text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground/68',
                  'transition-colors duration-150 hover:border-border/52 hover:text-foreground',
                  'focus-visible:outline-none',
                )}
              >
                <Calendar className="size-3" />
                Schedule
              </button>
              <button
                type="button"
                className={cn(
                  'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl',
                  'border border-border/30 bg-transparent text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground/68',
                  'transition-colors duration-150 hover:border-border/52 hover:text-foreground',
                  'focus-visible:outline-none',
                )}
              >
                <Plus className="size-3" />
                Create Lead
              </button>
            </div>
          </div>

          {/* ── Next Actions ── */}
          {actions.length > 0 && (
            <div className="mb-4 border-b border-border/12 pb-4">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
                Next Actions
              </p>
              <div className="space-y-2.5">
                {actions.slice(0, 2).map(action => (
                  <div key={action.id} className="flex items-start gap-2.5">
                    <div className={cn(
                      'mt-1 size-2 shrink-0 rounded-full',
                      PRIORITY_DOT[action.priority],
                    )} />
                    <div>
                      <p className="text-[12px] font-semibold leading-tight text-foreground">
                        {action.action}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground/58">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Property Health ── */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-border/14 bg-muted/8 p-4">

            {/* Score header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
                  Property Health
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-black leading-none tabular-nums text-foreground">
                    {health.score}
                  </span>
                  <span className="text-[12px] text-muted-foreground/45">/100</span>
                  <span className={cn('text-[11.5px] font-semibold', GRADE_TEXT[health.grade])}>
                    {health.label}
                  </span>
                </div>
              </div>
              <div className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                GRADE_BG[health.grade],
              )}>
                <span className={cn('text-[20px] font-black leading-none', GRADE_TEXT[health.grade])}>
                  {health.grade}
                </span>
              </div>
            </div>

            {/* Score track */}
            <div className="h-1.5 overflow-hidden rounded-full bg-border/18">
              <div
                className={cn('h-full rounded-full transition-[width] duration-700', GRADE_TRACK[health.grade])}
                style={{ width: `${health.score}%` }}
              />
            </div>

            {/* Factor scorecard — shows notes for any non-passing factor */}
            <div className="mt-3 space-y-1">
              {health.factors.map(f => (
                <div
                  key={f.id}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg py-1',
                    f.status !== 'pass' && 'bg-card/50 px-2.5 py-1.5',
                  )}
                >
                  <div className={cn(
                    'mt-1 size-1.5 shrink-0 rounded-full',
                    f.status === 'pass'    ? 'bg-emerald-500' :
                    f.status === 'warning' ? 'bg-amber-400'   : 'bg-rose-400',
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-[11px] leading-tight',
                      f.status === 'pass'
                        ? 'text-muted-foreground/55'
                        : 'font-medium text-foreground/82',
                    )}>
                      {f.label}
                    </p>
                    {f.note && f.status !== 'pass' && (
                      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/50">
                        {f.note}
                      </p>
                    )}
                  </div>
                  {f.status === 'pass' && (
                    <span className="shrink-0 text-[11px] text-emerald-500/65">✓</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grade improvement path */}
            {health.grade !== 'A' && (() => {
              const weak = health.factors.filter(f => f.status !== 'pass')
              if (weak.length === 0) return null
              return (
                <div className="mt-3 border-t border-border/10 pt-3">
                  <p className="text-[10px] leading-snug text-muted-foreground/50">
                    <span className="font-semibold text-foreground/58">To reach Grade A: </span>
                    {weak.slice(0, 3).map(f => f.label).join(', ')}
                    {weak.length > 3 && ` +${weak.length - 3} more`}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* ── Market Demand Indicator ── */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-border/14 bg-muted/8 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
                Market Demand
              </p>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-[10.5px] font-semibold',
                  demand.level === 'very-high' || demand.level === 'high'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : demand.level === 'medium' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground/50',
                )}>
                  {demand.level === 'very-high' || demand.level === 'high'
                    ? '↑ Favorable'
                    : demand.level === 'medium' ? '→ Moderate'
                    : '↓ Cautious'}
                </span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[10.5px] font-bold', DEMAND_BADGE[demand.level])}>
                  {demand.label}
                </span>
              </div>
            </div>

            {demand.signals.length > 0 ? (
              <div className="mt-2.5 space-y-1.5">
                {demand.signals.map(s => (
                  <div key={s.id} className="flex items-start gap-2">
                    <div className={cn(
                      'mt-1 size-1.5 shrink-0 rounded-full',
                      s.positive ? 'bg-emerald-500/75' : 'bg-amber-400/75',
                    )} />
                    <p className={cn(
                      'text-[10.5px] leading-snug',
                      s.positive ? 'text-foreground/65' : 'text-muted-foreground/55',
                    )}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[10.5px] italic text-muted-foreground/45">
                No strong demand signals detected
              </p>
            )}
          </div>

          {/* ── Property meta ── */}
          <div className="mb-4 space-y-2 border-b border-border/12 pb-4 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground/58">Status</span>
              <span className="font-semibold text-foreground/85">{status}</span>
            </div>
            {type && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground/58">Type</span>
                <span className="font-medium text-foreground/78">{type}</span>
              </div>
            )}
            {propertyCode && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground/58">Reference</span>
                <span className="font-mono text-muted-foreground/68">#{propertyCode}</span>
              </div>
            )}
            {purpose && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Home className="size-3 shrink-0 text-muted-foreground/45" />
                  <span className="text-muted-foreground/58">Purpose</span>
                </div>
                <span className="font-medium text-foreground/78">{purpose}</span>
              </div>
            )}
          </div>

          {/* ── Location ── */}
          {displayLocation && (
            <div className="mb-4 border-b border-border/12 pb-4">
              <div className="mb-2 flex items-start gap-2">
                <MapPin className="mt-0.5 size-3 shrink-0 text-muted-foreground/52" />
                <span className="text-[12px] font-medium leading-snug text-foreground/80">
                  {displayLocation}
                </span>
              </div>
              <div className="flex items-center gap-4 pl-5">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/70 focus-visible:outline-none"
                >
                  <Navigation className="size-3" />
                  Maps
                </a>
                <button
                  type="button"
                  onClick={onCopyAddress}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/55 transition-colors hover:text-foreground focus-visible:outline-none"
                >
                  <Copy className="size-3" />
                  {addressCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* ── Agent + Dates ── */}
          <div className="mb-4 divide-y divide-border/12 border-y border-border/12">
            {assignedUserName && (
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-1.5">
                  <User className="size-3 shrink-0 text-muted-foreground/45" />
                  <span className="text-[11px] font-medium text-muted-foreground/62">Agent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/12">
                    <User className="size-2 text-primary" />
                  </div>
                  <span className="text-[11.5px] font-semibold text-foreground">{assignedUserName}</span>
                </div>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-3 shrink-0 text-muted-foreground/45" />
                  <span className="text-[11px] font-medium text-muted-foreground/62">Listed</span>
                </div>
                <span className="text-[11px] tabular-nums text-foreground/65">
                  {fmtDate(createdAt)}
                </span>
              </div>
            )}
            {modifiedAt && (
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3 shrink-0 text-muted-foreground/45" />
                  <span className="text-[11px] font-medium text-muted-foreground/62">Updated</span>
                </div>
                <span className="text-[11px] tabular-nums text-foreground/65">
                  {fmtDate(modifiedAt)}
                </span>
              </div>
            )}
          </div>

          {/* ── Utility actions ── */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
            >
              <Pencil className="size-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={onToggleFav}
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none',
                favorited ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground/60 hover:text-foreground',
              )}
            >
              <Heart className={cn('size-3', favorited && 'fill-current')} />
              {favorited ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
            >
              <Share2 className="size-3" />
              Share
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
            >
              <Download className="size-3" />
              PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
