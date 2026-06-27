'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, MapPin, TrendingUp, Award, Zap, Layers, Hash } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import { fmtPrice } from '../../lib/display'
import type { PropertyStatus } from '../../types/property.types'
import type { PropertyHealth } from '../../lib/property-health'

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
  purpose?:      string
  yearBuilt?:    number
  energyClass?:  string
  isPremium?:    boolean
  isFeatured?:   boolean
  isVerified?:   boolean
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
  health,
  square,
  bedroomCount,
  purpose,
  yearBuilt,
  energyClass,
  isPremium,
  isFeatured,
  isVerified,
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
  const prev    = () => setActiveIndex(i => (i - 1 + images.length) % images.length)
  const next    = () => setActiveIndex(i => (i + 1) % images.length)

  // ── Derived content ────────────────────────────────────────────────────────
  const specsLabel = (() => {
    if (bedroomCount && square)   return `${bedroomCount} Beds · ${square} m²`
    if (bedroomCount)             return `${bedroomCount} Bedrooms`
    if (square)                   return `${square} m²`
    return purpose ? `For ${purpose}` : (status ?? 'Property')
  })()

  const vintageLabel = (() => {
    if (yearBuilt)   return `Built ${yearBuilt}`
    if (energyClass) return `Energy Class ${energyClass}`
    return purpose ? `For ${purpose}` : (type ?? 'Property')
  })()

  const pricePerSqm = price && square ? Math.round(price / square) : null

  const statusColor =
    status === 'Available'                                                          ? 'text-brand-emerald' :
    status === 'Sold' || status === 'Rented'                                        ? 'text-brand-crimson' :
    status === 'Reserved' || status === 'Pending' || status === 'Under Approval'    ? 'text-amber-600'     :
    'text-primary'

  const qualityPill =
    isPremium  ? 'PREMIUM PORTFOLIO LISTING' :
    isFeatured ? 'FEATURED LISTING'           :
    isVerified ? 'VERIFIED LISTING'           :
    null

  const activePill = purpose
    ? `FOR ${purpose.toUpperCase()}`
    : (status?.toUpperCase() ?? null)

  return (
    <>
      {/* ── Hero — exact Stitch: h-[620px] rounded-[32px] shadow-lg group ─────── */}
      <div
        className="group relative h-155 rounded-[32px] overflow-hidden shadow-2xl cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        {/* Image — Stitch: transition-transform duration-[4s] group-hover:scale-105 */}
        <Image
          src={src(activeIndex)}
          alt={title || 'Property'}
          fill
          priority
          unoptimized
          className="object-cover transition-transform duration-[4s] group-hover:scale-105"
          sizes="(max-width: 1023px) 100vw, 65vw"
          onError={() => onError(activeIndex)}
        />

        {/* Overlay — Stitch .hero-overlay: linear-gradient(180deg, transparent→dark) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,24,40,0)_0%,rgba(16,24,40,0.35)_50%,rgba(16,24,40,0.92)_100%)]" />

        {/* ── TOP-LEFT: Floating card — exact Stitch: glass-premium rounded-2xl p-4 ── */}
        <div
          className="absolute top-6 left-6 z-20"
          onClick={e => e.stopPropagation()}
        >
          <div className="glass-premium rounded-2xl p-5 shadow-xl border border-white/40 flex items-center gap-4 bg-white/88 backdrop-blur-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
              {propertyCode ? <Hash className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">
                {propertyCode ? 'Ref Code' : 'Completeness'}
              </div>
              <div className="text-2xl font-black text-foreground font-heading tracking-tight">
                {propertyCode ?? `${health.score}%`}
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP-RIGHT: Status/Type/Code pills — replaces Stitch property switcher ── */}
        <div
          className="absolute top-6 right-6 z-20 flex gap-2"
          onClick={e => e.stopPropagation()}
        >
          {status && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm bg-primary border-primary text-white"
            >
              {status}
            </button>
          )}
          {type && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm bg-white/80 backdrop-blur-md border-white/20 text-foreground/85 hover:bg-white"
            >
              {type}
            </button>
          )}
          {propertyCode && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm bg-white/80 backdrop-blur-md border-white/20 text-foreground/85 hover:bg-white"
            >
              #{propertyCode}
            </button>
          )}
          <button
            type="button"
            aria-label="View full screen"
            onClick={e => { e.stopPropagation(); setLightboxOpen(true) }}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              'border border-white/15 bg-black/45 text-white backdrop-blur-md',
              'opacity-0 transition-opacity duration-200 group-hover:opacity-75 hover:opacity-100!',
              'focus-visible:outline-none',
            )}
          >
            <Expand className="size-4" />
          </button>
        </div>

        {/* ── NAV ARROWS — multi-image carousel ─────────────────────────────── */}
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image"
              onClick={e => { e.stopPropagation(); prev() }}
              className={cn(
                'absolute left-4 top-1/2 z-20 -translate-y-1/2',
                'flex h-11 w-11 items-center justify-center rounded-full',
                'border border-white/15 bg-black/45 text-white backdrop-blur-md',
                'opacity-0 transition-all duration-200 group-hover:opacity-100',
                'hover:scale-110 hover:bg-black/65 focus-visible:outline-none',
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Next image"
              onClick={e => { e.stopPropagation(); next() }}
              className={cn(
                'absolute right-4 top-1/2 z-20 -translate-y-1/2',
                'flex h-11 w-11 items-center justify-center rounded-full',
                'border border-white/15 bg-black/45 text-white backdrop-blur-md',
                'opacity-0 transition-all duration-200 group-hover:opacity-100',
                'hover:scale-110 hover:bg-black/65 focus-visible:outline-none',
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* ── BOTTOM — exact Stitch: absolute bottom-8 left-8 right-8 flex … items-end gap-6 */}
        <div
          className="absolute bottom-8 left-8 right-8 z-20 flex flex-col md:flex-row justify-between items-end gap-6"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Bottom-left — exact Stitch: text-white max-w-xl ─────────── */}
          <div className="text-white max-w-xl">
            {/* Badge pills — exact Stitch spacing and styles */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {qualityPill && (
                <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {qualityPill}
                </span>
              )}
              {activePill && (
                <span className="bg-primary px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {activePill}
                </span>
              )}
            </div>

            {/* Title — exact Stitch: text-5xl lg:text-7xl font-black tracking-tighter mb-4 font-headline leading-none drop-shadow-lg */}
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-4 font-heading leading-none drop-shadow-lg">
              {title || 'Property'}
            </h1>

            {/* Location — exact Stitch: bg-black/20 backdrop-blur-md w-fit px-3.5 py-1.5 rounded-xl border border-white/10 */}
            {location && (
              <div className="flex items-center gap-2 text-white/90 bg-black/20 backdrop-blur-md w-fit px-3.5 py-1.5 rounded-xl border border-white/10">
                <MapPin className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold tracking-tight">{location}</p>
              </div>
            )}
          </div>

          {/* ── Bottom-right: Investment Briefing Card ─────────────────────
               Exact Stitch: glass-premium rounded-3xl p-6 w-full md:w-[330px]
                             shadow-xl border border-white/50 transform origin-bottom-right */}
          {price != null && (
            <div className="bg-white/88 backdrop-blur-2xl rounded-3xl p-7 w-full md:w-90 shadow-2xl border border-white/55 transform origin-bottom-right">
              {/* Header — exact Stitch: flex justify-between items-center mb-4 */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Investment Briefing
                </span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-emerald/10 text-brand-emerald rounded-full text-[9px] font-black border border-brand-emerald/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                  ASKING PRICE
                </div>
              </div>

              {/* Price — exact Stitch: text-4xl lg:text-5xl font-black … mb-4 font-headline tracking-tighter */}
              <div className="text-4xl lg:text-5xl font-black text-foreground mb-4 font-heading tracking-tighter">
                {fmtPrice(price, false)}
              </div>

              {/* Signal pills — exact Stitch colour tracks: emerald / primary / azure */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-brand-emerald font-bold text-xs bg-brand-emerald/5 p-2 rounded-lg border border-brand-emerald/15">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>{`${type ?? 'Property'}${location ? ` · ${location}` : ''}`}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs bg-primary/5 p-2 rounded-lg border border-primary/15">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>{specsLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-brand-azure font-bold text-xs bg-brand-azure/5 p-2 rounded-lg border border-brand-azure/15">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>{vintageLabel}</span>
                </div>
              </div>

              {/* Footer — exact Stitch: pt-4 border-t border-border/50 flex justify-between items-center */}
              <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                <div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                    Status
                  </div>
                  <div className={cn('text-sm font-black font-heading uppercase tracking-tight', statusColor)}>
                    {status ?? '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                    {pricePerSqm != null ? 'Per m²' : 'Area'}
                  </div>
                  <div className="text-sm font-black text-brand-emerald font-heading tracking-tight">
                    {pricePerSqm != null
                      ? `${pricePerSqm.toLocaleString('en-US')} / m²`
                      : square
                        ? `${square} m²`
                        : '—'}
                  </div>
                </div>
              </div>
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
