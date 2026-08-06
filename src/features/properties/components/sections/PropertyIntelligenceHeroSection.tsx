'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import { PropertyIndicatorPills } from '../PropertyIndicators'
import { getStatusLabel } from '../PropertyStatusBadge'
import { getPropertyTypeLabel } from '../../domain/property-type.registry'
import type { HeroViewModel } from '../../view-models/hero.viewmodel'

// Property Overview Header redesign (2026-07-18). This section is an
// Executive Property Summary Header for an enterprise dashboard, not a
// listing-site hero — the real photo gallery already lives later on this
// page (Asset Management System).
//
// Information Architecture refinement (2026-07-22). This component's job is
// identity only — image, status, property type, transaction type, title,
// property code, address. Every one of those already lives in the photo
// overlay below. The solid "Executive Summary" panel that used to sit under
// the photo (first Price/Price-m²/Area/Year Built/Energy/Availability, then
// — after an earlier pass in the same day — Category/Condition/Listing Age)
// is removed outright, not just re-populated a second time: on review,
// nothing that belongs there survives the "does this belong in Hero, or did
// we just need somewhere to put it" test.
//   - Price/Price-per-m² → Financial Intelligence, one section below.
//   - Area/Year Built/Energy Class → Quick Specifications.
//   - Availability → the Status badge two lines above, and Command Hub.
//   - Category → Command Hub's "Property Information" line (its one home).
//   - Condition → promoted to Quick Specifications instead (a physical
//     attribute belongs beside Bedrooms/Bathrooms/Area, not in an identity
//     header — and Quick Specifications was the explicitly invited home for
//     exactly this kind of promotion).
//   - Listing Age → dropped, not relocated. It was never a real stored
//     field, only a same-day computed restatement of `createdAt` — which
//     Financial Intelligence already shows as an absolute "Listed" date.
// A Hero limited to real identity fields is lighter, not incomplete — every
// fact a first-time reader needs to orient ("what is this, where is it, is
// it available") is on screen in the first 320px, nothing else competes for
// that same instant.
//
// Enterprise architecture pass (2026-07-23). Status→fill-color mapping
// moved to the shared `status-presentation` mapper (see
// `HeroViewModel.statusFillClass`, built by `hero.viewmodel.ts`). The
// confirmed-dead `health`/`bedroomCount` props are dropped — neither was
// ever read in this file's body. The `mainImageId`-triggered re-dedup path
// is also dropped: the one real call site (PropertyDetailView) never passed
// `mainImageId` here — the already-ordered gallery arrives as `imageIds`
// (see PropertyDetailView's `buildHeroGalleryIds`) — so the dedup branch was
// unreachable dead code, not a live behavior.

interface PropertyIntelligenceHeroSectionProps {
  viewModel: HeroViewModel
  /** Media Gallery Consistency pass (2026-07-24). These replace what used to
   *  be this component's own local `activeIndex`/`lightboxOpen` state — and
   *  this component no longer renders a Lightbox of its own at all. Owned by
   *  PropertyDetailView now and shared byte-for-byte with Asset Management's
   *  Photos tab and the single shared `<MediaLightbox>` PropertyDetailView
   *  renders, so the Hero banner, the Photos grid, and the fullscreen viewer
   *  they both open are one gallery with one Lightbox instance, not three.
   *  See PropertyDetailView.tsx's own `mediaIndex`/`mediaLightboxOpen` note. */
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onLightboxOpenChange: (open: boolean) => void
  /** Shared focus-restore target — see PropertyDetailView.tsx's own
   *  `mediaTriggerRef` note. Captured here at click/keyboard-open time so
   *  the single shared Lightbox can focus this exact trigger back on close,
   *  even though the Lightbox itself is rendered by a different component. */
  triggerRef: React.RefObject<HTMLElement | null>
}

export function PropertyIntelligenceHeroSection({
  viewModel, activeIndex, onActiveIndexChange, onLightboxOpenChange, triggerRef,
}: PropertyIntelligenceHeroSectionProps) {
  const { t } = useTranslation('properties')
  const {
    imageIds, title, location, status, statusFillClass, type, propertyCode,
    requestType, isPremium, isFeatured, isVerified, isNewListing,
  } = viewModel
  const propertyFallback = t('common.propertyFallback')

  const images = imageIds.length > 0 ? imageIds : [null as string | null]

  const [errored, setErrored] = useState<Set<string>>(new Set())

  // Same `resolve`/`onErr` id-keyed contract MediaLightbox and Asset
  // Management both already use — replaces the old index-keyed `src`/
  // `onError` pair now that this component hands its images to the shared
  // viewer instead of rendering its own.
  function resolve(id: string | null | undefined, size?: 'small' | 'medium' | 'large'): string {
    if (!id || errored.has(id)) return FALLBACK_IMAGE
    return getWebAssetUrl(id, size)
  }
  function onErr(id: string) { setErrored(s => new Set([...s, id])) }

  const prev = useCallback(
    () => onActiveIndexChange((activeIndex - 1 + images.length) % images.length),
    [activeIndex, images.length, onActiveIndexChange],
  )
  const next = useCallback(
    () => onActiveIndexChange((activeIndex + 1) % images.length),
    [activeIndex, images.length, onActiveIndexChange],
  )

  // Same explicit focus-restore pattern Asset Management's own lightbox
  // trigger uses (see that file's own note on why Radix's default silently
  // fails on this page) — captured on click/keyboard-open, written into the
  // shared `triggerRef` PropertyDetailView's single MediaLightbox instance
  // reads from.
  function openLightbox() {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    onLightboxOpenChange(true)
  }

  // Photo banner itself is still the open-lightbox trigger; keyboard
  // equivalent preserved unchanged from Interaction Design Sprint 4. Arrow-
  // key *browsing* here (banner focused, lightbox closed) is distinct from
  // MediaLightbox's own arrow-key handling (lightbox open) — different
  // focus targets, so the two never conflict — but both now write to the
  // exact same shared `activeIndex`.
  function onBannerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openLightbox()
    } else if (e.key === 'ArrowLeft' && images.length > 1) {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      e.preventDefault()
      next()
    }
  }

  const hasQualitySignal = isPremium || isFeatured || isVerified || isNewListing

  return (
    <div className="rounded-2xl overflow-hidden shadow-design-lg border border-border/50">

      {/* ── Photo banner — contextual support, not the point ─────────────
          Reduced from 620px to 320px and given a stronger, more
          consistent scrim specifically so this reads as a supporting
          banner rather than a gallery hero; every KPI a reader actually
          needs lives in the solid panel below, not on the photo. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          images.length > 1
            ? t('hero.viewPhotosFullScreen', { title: title || propertyFallback, count: images.length })
            : t('hero.viewPhotoFullScreen', { title: title || propertyFallback })
        }
        className={cn(
          'group relative h-80 overflow-hidden cursor-zoom-in',
          'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-inset',
        )}
        onClick={openLightbox}
        onKeyDown={onBannerKeyDown}
      >
        <Image
          src={resolve(images[activeIndex])}
          alt={title || propertyFallback}
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
          onError={() => { const id = images[activeIndex]; if (id) onErr(id) }}
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

        {/* Top-left: quality signals — trust indicators, not a data field,
            so they stay the one thing still allowed to float. */}
        {hasQualitySignal && (
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-[calc(100%-2.5rem)]" onClick={e => e.stopPropagation()}>
            <PropertyIndicatorPills
              isFeatured={isFeatured} isVerified={isVerified}
              isPremium={isPremium} isNewListing={isNewListing}
              size="md"
            />
          </div>
        )}

        {/* Top-right: expand-to-lightbox, unchanged from Interaction
            Design Sprint 4 (touch-visible, keyboard-operable). */}
        <div className="absolute top-4 right-4 z-20" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label={t('hero.viewFullScreen')}
            onClick={e => { e.stopPropagation(); openLightbox() }}
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
            <button type="button" aria-label={t('hero.previousImage')}
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
            <button type="button" aria-label={t('hero.nextImage')}
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
                statusFillClass,
              )}>
                {getStatusLabel(status, t)}
              </span>
            )}
            {type && (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/20 bg-white/10 backdrop-blur-sm text-white/90">
                {getPropertyTypeLabel(type, t)}
              </span>
            )}
            {requestType && (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/20 bg-white/10 backdrop-blur-sm text-white/90">
                {t('common.for')} {requestType}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-[28px] lg:text-4xl font-black tracking-tight font-heading leading-[1.08] text-white drop-shadow-md truncate max-w-full">
              {title || propertyFallback}
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
    </div>
  )
}
