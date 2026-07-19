'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, MapPin, Ruler, CalendarDays, Zap, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import { fmtPrice } from '../../lib/display'
import type { PropertyStatus } from '../../types/property.types'
import type { PropertyHealth } from '../../lib/property-health'

// Property Overview Header redesign (2026-07-18). This section is an
// Executive Property Summary Header for an enterprise dashboard, not a
// listing-site hero — the real photo gallery already lives later on this
// page (Asset Management System). Two deliberate changes from the prior
// version drive everything below:
//   1. The photo shrank from 620px to a 320px banner with a stronger scrim,
//      and stopped being the only place identity information lives.
//   2. A solid (non-photo) Executive Summary panel now carries the KPIs —
//      Asking Price, Price/m², Area, Year Built, Status, Type, Address,
//      Listing Type — so reading them never depends on how bright a given
//      region of the photo happens to be.
// `health` remains an unused-looking prop only in the sense that its old
// "Completeness %" floating card is gone — Command Hub already owns
// completeness as a labeled section, so this component no longer needs a
// second copy of it.

interface PropertyIntelligenceHeroSectionProps {
  mainImageId?:  string | null
  imageIds?:     string[]
  title?:        string
  location?:     string
  status?:       PropertyStatus
  type?:         string
  propertyCode?: string
  price?:        number
  health:        PropertyHealth
  square?:       number
  bedroomCount?: number
  requestType?:  string
  yearBuilt?:    number
  energyClass?:  string
  isPremium?:    boolean
  isFeatured?:   boolean
  isVerified?:   boolean
  isNewListing?: boolean
}

// Wave 2 (2026-07-14): rebuilt for the real 8-value live status enum — see
// the approved Product Decision Record for the old→new mapping. Reused here
// for the Status badge's solid fill instead of a text-color-only treatment.
function statusFillClass(status?: PropertyStatus): string {
  if (status === 'Active')                                              return 'bg-brand-emerald border-brand-emerald'
  if (status === 'Sold' || status === 'Rented')                         return 'bg-brand-crimson border-brand-crimson'
  if (status === 'Under Approval' || status === 'Not Approved' ||
      status === 'Under negotiation' || status === 'Received payment')  return 'bg-amber-600 border-amber-600'
  return 'bg-primary border-primary'
}

export function PropertyIntelligenceHeroSection({
  mainImageId,
  imageIds = [],
  title,
  location,
  status,
  type,
  propertyCode,
  price,
  square,
  requestType,
  yearBuilt,
  energyClass,
  isPremium,
  isFeatured,
  isVerified,
  isNewListing,
}: PropertyIntelligenceHeroSectionProps) {
  const allIds = mainImageId
    ? [mainImageId, ...imageIds.filter(id => id !== mainImageId)]
    : imageIds
  const images = allIds.length > 0 ? allIds : [null as string | null]

  const [activeIndex, setActiveIndex]   = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [errored, setErrored]           = useState<Set<number>>(new Set())

  const src     = (i: number) => errored.has(i) ? FALLBACK_IMAGE : getWebAssetUrl(images[i])
  const onError = (i: number) => setErrored(s => new Set([...s, i]))
  const prev    = useCallback(() => setActiveIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const next    = useCallback(() => setActiveIndex(i => (i + 1) % images.length), [images.length])

  // Interaction Design Sprint 4 (2026-07-18). Lightbox keyboard navigation —
  // Escape-to-close is already handled by the Dialog primitive; only arrow-
  // key image stepping needs to be added here.
  useEffect(() => {
    if (!lightboxOpen || images.length <= 1) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, images.length, prev, next])

  // Photo banner itself is still the open-lightbox trigger; keyboard
  // equivalent preserved unchanged from Interaction Design Sprint 4.
  function onBannerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setLightboxOpen(true)
    } else if (e.key === 'ArrowLeft' && images.length > 1) {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      e.preventDefault()
      next()
    }
  }

  const pricePerSqm = price != null && square ? Math.round(price / square) : null

  const qualityPill =
    isPremium    ? 'PREMIUM PORTFOLIO' :
    isFeatured   ? 'FEATURED'          :
    isVerified   ? 'VERIFIED'          :
    isNewListing ? 'NEW LISTING'       :
    null

  return (
    <>
      <div className="rounded-2xl overflow-hidden shadow-design-lg border border-border/50">

        {/* ── Photo banner — contextual support, not the point ─────────────
            Reduced from 620px to 320px and given a stronger, more
            consistent scrim specifically so this reads as a supporting
            banner rather than a gallery hero; every KPI a reader actually
            needs lives in the solid panel below, not on the photo. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`View ${title || 'property'} photos full screen${images.length > 1 ? ` — ${images.length} images` : ''}`}
          className={cn(
            'group relative h-80 overflow-hidden cursor-zoom-in',
            'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-inset',
          )}
          onClick={() => setLightboxOpen(true)}
          onKeyDown={onBannerKeyDown}
        >
          <Image
            src={src(activeIndex)}
            alt={title || 'Property'}
            fill
            priority
            unoptimized
            className={cn(
              'object-cover transition-transform duration-700 group-hover:scale-105',
              // Final polish pass (2026-07-18): a whisper of contrast and
              // saturation — the single highest-leverage fix for "flat,
              // lifeless, too soft" — tuned to stay believable rather than
              // HDR-looking. No blur, no opacity wash; the photo itself
              // still does all the work.
              'contrast-[1.06] saturate-[1.1] brightness-[1.015]',
            )}
            style={{ objectPosition: '50% 42%' }}
            sizes="(max-width: 1023px) 100vw, 65vw"
            onError={() => onError(activeIndex)}
          />

          {/* Final polish pass: a five-stop directional gradient (was four)
              for a genuinely photographic light falloff — a real
              transparent band through the middle instead of a sudden jump
              from "barely there" to "dark enough to read text" — plus a
              second, radial layer that only darkens the far corners, the
              way a vignette on an actual lens does. Neither layer is a
              blur or an opaque wash; the property is fully visible through
              both. */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,20,0.30)_0%,rgba(10,14,20,0.00)_22%,rgba(10,14,20,0.05)_42%,rgba(10,14,20,0.32)_68%,rgba(10,14,20,0.82)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_40%,transparent_58%,rgba(10,14,20,0.16)_100%)]" />

          {/* Top-left: quality signal only — a trust indicator, not a data
              field, so it stays the one thing still allowed to float. */}
          {qualityPill && (
            <div className="absolute top-4 left-4 z-20" onClick={e => e.stopPropagation()}>
              <span className="bg-white/12 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                {qualityPill}
              </span>
            </div>
          )}

          {/* Top-right: expand-to-lightbox, unchanged from Interaction
              Design Sprint 4 (touch-visible, keyboard-operable). */}
          <div className="absolute top-4 right-4 z-20" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label="View full screen"
              onClick={e => { e.stopPropagation(); setLightboxOpen(true) }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                'border border-white/15 bg-black/45 text-white backdrop-blur-md',
                'opacity-70 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-75 hover:opacity-100!',
                'focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70',
              )}
            >
              <Expand className="size-4" />
            </button>
          </div>

          {/* Nav arrows — multi-image carousel, unchanged from Sprint 4 */}
          {images.length > 1 && (
            <>
              <button type="button" aria-label="Previous image"
                onClick={e => { e.stopPropagation(); prev() }}
                className={cn(
                  'absolute left-3 top-1/2 z-20 -translate-y-1/2',
                  'flex h-9 w-9 items-center justify-center rounded-full',
                  'border border-white/15 bg-black/45 text-white backdrop-blur-md',
                  'opacity-70 transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100',
                  'hover:scale-110 hover:bg-black/65 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                )}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" aria-label="Next image"
                onClick={e => { e.stopPropagation(); next() }}
                className={cn(
                  'absolute right-3 top-1/2 z-20 -translate-y-1/2',
                  'flex h-9 w-9 items-center justify-center rounded-full',
                  'border border-white/15 bg-black/45 text-white backdrop-blur-md',
                  'opacity-70 transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100',
                  'hover:scale-110 hover:bg-black/65 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                )}
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}

          {/* ── Identity — Status → Type → Name → Address ───────────────────
              Elevation polish: deliberate breathing room between each tier
              (gap-3, not gap-2) instead of everything huddled together: the
              badges are a distinct row, the name gets room to be the
              anchor, the address sits clearly below it — three tiers a
              reader can separate at a glance, not one dense block. */}
          <div
            className="absolute inset-x-5 bottom-5 z-20 flex flex-col gap-3 max-w-[calc(100%-2.5rem)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {status && (
                <span className={cn(
                  'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border text-white shadow-sm',
                  statusFillClass(status),
                )}>
                  {status}
                </span>
              )}
              {type && (
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/20 bg-white/10 backdrop-blur-sm text-white/90">
                  {type}
                </span>
              )}
              {requestType && (
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/20 bg-white/10 backdrop-blur-sm text-white/90">
                  For {requestType}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-[28px] lg:text-4xl font-black tracking-tight font-heading leading-[1.08] text-white drop-shadow-md truncate max-w-full">
                {title || 'Property'}
              </h1>
              {propertyCode && (
                <span className="text-[10px] font-mono font-semibold text-white/50 tracking-wide shrink-0">
                  #{propertyCode}
                </span>
              )}
            </div>

            {location && (
              <div className="flex items-center gap-1.5 text-white/75">
                <MapPin className="size-3.5 shrink-0" />
                <p className="text-[12.5px] font-medium tracking-tight truncate">{location}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Executive Summary panel — solid, not photo-dependent ─────────
            Final polish pass: the panel now carries a soft inset shadow at
            its top edge — the photo casting a whisper of depth onto the
            panel below — so the cut from photo to solid surface reads as
            one continuous composition instead of an abrupt seam. */}
        <div className="relative bg-linear-to-b from-muted/20 to-card px-6 pt-7 pb-7 sm:px-8 sm:pt-8 sm:pb-8 shadow-[inset_0_10px_16px_-14px_rgba(0,0,0,0.18)]">

          {/* Final polish pass (2026-07-18): baseline-aligned instead of
              bottom-aligned — Price and Price/m² now share a natural text
              baseline rather than being nudged into place with a manual
              offset, which is what made the old spacing feel mechanical.
              The label picks up a faint primary tint, a single quiet
              accent tying this panel back to the primary-accented details
              in the Command Hub beside it. */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-6 mb-6 border-b border-border/25">
            <div>
              <p className="text-[9px] font-bold text-primary/55 uppercase tracking-wider mb-2">
                Asking Price
              </p>
              <p className={cn(
                'font-black font-heading tracking-tighter leading-none',
                price != null ? 'text-4xl sm:text-5xl text-foreground' : 'text-xl text-muted-foreground/40',
              )}>
                {price != null ? fmtPrice(price, false) : 'Not provided'}
              </p>
            </div>
            {pricePerSqm != null && (
              <div className="flex items-baseline gap-1 pl-6 border-l border-border/25">
                <span className="text-base font-bold text-muted-foreground/55 tracking-tight tabular-nums">
                  {pricePerSqm.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground/35">/m²</span>
              </div>
            )}
          </div>

          {/* Final polish pass: restored Availability alongside the true
              specs (Area, Year Built, Energy Class) — these four are the
              only fields on this card that don't already appear elsewhere.
              Address is deliberately demoted below as plain metadata
              rather than a fifth equal-weight card — it's context, not a
              spec a reader is scanning for. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryKpi icon={Ruler} label="Area" value={square != null ? `${square.toLocaleString('en-US')} m²` : '—'} />
            <SummaryKpi icon={CalendarDays} label="Year Built" value={yearBuilt != null ? String(yearBuilt) : '—'} />
            <SummaryKpi icon={Zap} label="Energy Class" value={energyClass ?? '—'} />
            <SummaryKpi icon={ShieldCheck} label="Availability" value={status === 'Active' ? 'Available' : status ?? '—'} />
          </div>

          {location && (
            <div className="mt-4 flex items-center gap-1.5 text-muted-foreground/40">
              <MapPin className="size-3 shrink-0" />
              <p className="text-[11px] font-medium truncate">{location}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-none bg-black/97 p-0 shadow-none">
          <DialogTitle className="sr-only">{title ?? 'Property gallery'}</DialogTitle>
          <div className="relative flex h-[85vh] items-center justify-center">
            <Image src={src(activeIndex)} alt={title || 'Property'} fill unoptimized
              className="object-contain" sizes="90vw" onError={() => onError(activeIndex)} />
            {images.length > 1 && (
              <>
                <button type="button" aria-label="Previous image" onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" aria-label="Next image" onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/50 px-5 py-2 text-[12px] font-semibold text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── SummaryKpi ───────────────────────────────────────────────────────────────
// Final polish pass: icon now sits in its own quiet chip (the same
// icon-in-a-tile language the Command Hub already uses for its header
// icon), border softened further, hover adds a 1px lift instead of a
// border-opacity jump — a subtler, more considered elevation cue.

function SummaryKpi({
  icon: Icon, label, value,
}: {
  icon:  React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  const isEmpty = value === '—'
  return (
    <div className={cn(
      'flex items-center gap-3 min-w-0 rounded-xl border border-border/35 bg-muted/3 px-4 py-3.5',
      'transition-all duration-200 ease-out',
      'hover:border-border/60 hover:-translate-y-px hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]',
      'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    )}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="size-4 text-muted-foreground/50" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className={cn(
          'text-[14px] font-black tracking-tight truncate',
          isEmpty ? 'text-muted-foreground/35' : 'text-foreground',
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}
