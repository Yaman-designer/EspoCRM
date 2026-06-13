'use client'

import { useState, memo, type ComponentType } from 'react'
import Image from 'next/image'
import {
  BedDouble, Bath, MapPin, Maximize2,
  Eye, Pencil, Trash2, Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, resolvePropertyImageId, FALLBACK_IMAGE } from '@/lib/image-url'
import { fmtPrice, getDisplayName, getDisplayLocation } from '../lib/display'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import { PropertyIndicatorPills } from './PropertyIndicators'
import type { RealEstateProperty } from '../types/property.types'

// ── StatChip ──────────────────────────────────────────────────────────────────
// Shared metric chip used in both grid and list views.
//
// grid — compact, auto-height, always-labeled, full-width flex-1
// list — 40px desktop, 90px+ min-width, label visible only on sm+

function StatChip({
  Icon,
  value,
  label,
  variant = 'grid',
}: {
  Icon: ComponentType<{ className?: string }>
  value: React.ReactNode
  label: string
  variant?: 'grid' | 'list'
}) {
  if (variant === 'list') {
    return (
      <div className={cn(
        'flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden',
        'rounded-[12px] border border-border/45 bg-muted/40',
        // tight default; relax gap + padding when the center column has more room
        'gap-1 px-1.5 @[240px]:gap-1.5 @[240px]:px-2',
      )}>
        <Icon className="size-4 shrink-0 text-muted-foreground/55" />
        <span className="shrink-0 text-[13px] font-semibold leading-none tabular-nums text-foreground">{value}</span>
        {label && (
          // label is the first thing to disappear — hide below 320px center column
          <span className="hidden shrink-0 text-[13px] font-medium leading-none text-muted-foreground/55 @[320px]:block">
            {label}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center justify-center',
      'min-w-0 flex-1 overflow-hidden',
      'rounded-md border border-border/30 bg-muted/50 gap-1 px-2 py-2 text-[11px]',
    )}>
      <Icon className="size-3 shrink-0 text-muted-foreground/60" />
      <span className="shrink-0 font-bold tabular-nums text-foreground">{value}</span>
      {label && (
        <span className="hidden sm:inline shrink-0 font-medium text-muted-foreground/60">{label}</span>
      )}
    </div>
  )
}

// ── QuickAction ───────────────────────────────────────────────────────────────
// Icon-only action button — grid card footer and list right panel.

function QuickAction({
  onClick,
  label,
  Icon,
  destructive,
}: {
  onClick: () => void
  label: string
  Icon: ComponentType<{ className?: string }>
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        destructive
          ? 'text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive'
          : 'text-muted-foreground/45 hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

// ── PropertyCard (grid view) ──────────────────────────────────────────────────
//
// Scan order: Image → Price → Status → Ref → Location → Type → Stats → CTA → Actions
//
// Mobile:  2-col grid. Card tap = view. Fav on image. Edit + Delete in footer.
// Desktop: CTA [flex-1, h-44px, radius-14px] + Edit + Delete side-by-side in footer.

interface PropertyCardProps {
  property:     RealEstateProperty
  onView:       (p: RealEstateProperty) => void
  onEdit:       (p: RealEstateProperty) => void
  onDelete:     (p: RealEstateProperty) => void
  onDuplicate?: (p: RealEstateProperty) => void
}

export const PropertyCard = memo(function PropertyCard({
  property,
  onView,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const {
    price, type, status,
    square, bedroomCount, bathroomCount,
    propertyCode,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
    isFollowed,
  } = property

  const displayName     = getDisplayName(property)
  const displayLocation = getDisplayLocation(property)

  const resolvedId = resolvePropertyImageId(mainImageId, imagesIds)
  const [imgSrc, setImgSrc]       = useState(() => getWebAssetUrl(resolvedId))
  const [favorited, setFavorited] = useState(() => !!isFollowed)

  const hasSpecs      = bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined
  const hasIndicators = !!(isFeatured || isVerified || isPremium || isNewListing)
  const heading       = propertyCode || displayName || '—'

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={heading}
      className={cn(
        'group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl bg-card',
        'border border-border/30',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.07)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-border/50',
        'hover:shadow-[0_12px_32px_rgba(0,0,0,0.11),0_4px_12px_rgba(0,0,0,0.06)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
      onClick={() => onView(property)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(property) } }}
    >

      {/* ── Image ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-xl bg-muted sm:h-auto sm:aspect-video">
        <Image
          src={imgSrc}
          alt={heading}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover brightness-[1.02] contrast-[1.06] saturate-[1.08] transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04]"
          sizes="(max-width: 639px) 50vw, (max-width: 871px) 33vw, (max-width: 1167px) 25vw, 20vw"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        {/* Gradient: subtle at top, atmospheric at bottom */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/5 to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.12)_100%)]" />

        {/* Status badge — top-left */}
        <div className="absolute left-3 top-3 z-10">
          <PropertyStatusBadge status={status} variant="overlay" />
        </div>

        {/* Favourite — top-right */}
        <div className="absolute right-3 top-3 z-10" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => setFavorited(f => !f)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200',
              favorited
                ? 'bg-rose-500 text-white shadow-[0_4px_14px_rgba(239,68,68,0.50)]'
                : 'bg-black/35 text-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:scale-[1.05] hover:bg-black/50 hover:text-white',
            )}
          >
            <Heart className={cn('size-3.5 transition-transform duration-150', favorited && 'fill-current scale-110')} />
          </button>
        </div>

        {/* Price — glassmorphism badge, bottom-left */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
          {price !== undefined ? (
            <div className="inline-flex items-center rounded-lg border border-white/18 bg-white/10 px-3.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-[14px]">
              <p className="truncate text-[16px] font-bold leading-none tracking-tight text-white tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.16)] sm:text-[20px]">
                {fmtPrice(price)}
              </p>
            </div>
          ) : (
            <div className="inline-flex items-center rounded-[15px] border border-white/15 bg-white/[0.07] px-3 py-1.5 backdrop-blur-md">
              <p className="text-[11px] font-medium italic text-white/60">Price on request</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-3">

        {/* Reference */}
        <p className="mb-2 min-w-0 truncate text-[14px] font-extrabold tracking-tight text-foreground tabular-nums sm:text-[20px]">
          {heading}
        </p>

        {/* Location */}
        {displayLocation && (
          <p className="mb-2 flex min-w-0 items-center gap-1 text-[11px] font-medium text-muted-foreground/75">
            <MapPin className="size-3 shrink-0 text-muted-foreground/50" />
            <span className="truncate">{displayLocation}</span>
          </p>
        )}

        {/* Property type chip — rounded-full pill, 12px below location */}
        {type ? (
          <div className="mb-3">
            <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
              {type}
            </span>
          </div>
        ) : displayLocation ? (
          <div aria-hidden className="mb-2" />
        ) : (
          <div aria-hidden className="mb-3 h-4" />
        )}

        {/* Quality indicators */}
        {hasIndicators && (
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <PropertyIndicatorPills
              isFeatured={isFeatured} isVerified={isVerified}
              isPremium={isPremium} isNewListing={isNewListing}
            />
          </div>
        )}

        {/* Stats chips — equal-width, auto-height, always labeled */}
        {hasSpecs && (
          <>
            <div className="mb-2 h-px bg-border/15" />
            <div className="mb-2 flex gap-1.5">
              {bedroomCount !== undefined && (
                <StatChip Icon={BedDouble} value={bedroomCount}            label="Beds"  variant="grid" />
              )}
              {bathroomCount !== undefined && (
                <StatChip Icon={Bath}      value={bathroomCount}           label="Baths" variant="grid" />
              )}
              {square !== undefined && (
                <StatChip Icon={Maximize2} value={square.toLocaleString()} label="m²"   variant="grid" />
              )}
            </div>
          </>
        )}

        {/* Footer: desktop CTA + Edit + Delete (always visible) */}
        {/* Mobile: card tap = view. Footer shows Edit + Delete right-aligned. */}
        <div
          className="mt-3 flex items-center justify-end gap-1.5 border-t border-border/15 pt-2.5"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onView(property)}
            className={cn(
              'hidden sm:flex h-9.5 flex-1 items-center justify-center gap-2',
              'rounded-lg bg-primary px-3',
              'text-[14px] font-semibold tracking-[0.01em] text-primary-foreground',
              'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]',
              'transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_4px_14px_rgba(0,0,0,0.10)]',
              'active:translate-y-0 active:scale-[0.99]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            Details
            <span className="text-[13px] font-normal text-primary-foreground/60">→</span>
          </button>
          <QuickAction onClick={() => onEdit(property)}   label="Edit property"   Icon={Pencil} />
          <QuickAction onClick={() => onDelete(property)} label="Delete property" Icon={Trash2} destructive />
        </div>

      </div>

    </article>
  )
})


// ── PropertyListRow (list-view variant) ──────────────────────────────────────
//
// 3-zone layout (desktop) / 2-zone (mobile):
//
//   LEFT   — Image (w-36 mobile / w-52 desktop). Status badge bottom-left.
//             Favourite button top-right. Always flex-shrink: 0.
//   CENTER — Info column (flex-1).
//             Price → REF → Location → Type[12px] → Stats + CTA[16px].
//             Mobile-only Edit+Delete inline in price row (sm:hidden).
//   RIGHT  — Delete + Edit panel (desktop only, sm:w-20). Delete on top.
//
// Spacing grid: 8px base. Location→Type=12px, Type→Stats=16px.

interface PropertyListRowProps {
  property:     RealEstateProperty
  onView:       (p: RealEstateProperty) => void
  onEdit:       (p: RealEstateProperty) => void
  onDelete:     (p: RealEstateProperty) => void
  onDuplicate?: (p: RealEstateProperty) => void
}

export const PropertyListRow = memo(function PropertyListRow({
  property,
  onView,
  onEdit,
  onDelete,
}: PropertyListRowProps) {
  const {
    price, type, status,
    square, bedroomCount, bathroomCount,
    propertyCode,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
    isFollowed,
  } = property

  const displayName     = getDisplayName(property)
  const displayLocation = getDisplayLocation(property)

  const hasIndicators = !!(isFeatured || isVerified || isPremium || isNewListing)
  const heading       = propertyCode || displayName || '—'

  const [imgSrc, setImgSrc]       = useState(() => getWebAssetUrl(resolvePropertyImageId(mainImageId, imagesIds)))
  const [favorited, setFavorited] = useState(() => !!isFollowed)

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={heading}
      onClick={() => onView(property)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(property) } }}
      className={cn(
        'group flex min-w-[320px] cursor-pointer overflow-hidden rounded-xl bg-card',
        'border border-border/25',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:border-border/45',
        'hover:shadow-[0_8px_28px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
    >

      {/* ── LEFT: Image ─────────────────────────────────────────────────────── */}
      {/* w-36 (144px) mobile — never shrinks below 140px spec.                 */}
      {/* w-52 (208px) desktop — substantial visual hero.                       */}
      <div className="relative w-36 shrink-0 self-stretch overflow-hidden rounded-l-xl sm:w-52">
        <Image
          src={imgSrc}
          alt={heading}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover brightness-[1.02] contrast-[1.05] saturate-[1.08] transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04]"
          sizes="(max-width: 639px) 144px, 208px"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/55" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.12)_100%)]" />

        {/* Status — bottom-left */}
        <div className="absolute bottom-3 left-3 z-10">
          <PropertyStatusBadge status={status} variant="overlay" />
        </div>

        {/* Favourite — top-right */}
        <div className="absolute right-2.5 top-2.5 z-10" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => setFavorited(f => !f)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md',
              'transition-all duration-200 ease-out active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              favorited
                ? 'bg-rose-500 text-white shadow-[0_4px_14px_rgba(239,68,68,0.55)]'
                : 'bg-black/30 text-white/75 hover:bg-rose-500 hover:text-white hover:shadow-[0_4px_14px_rgba(239,68,68,0.40)]',
            )}
          >
            <Heart className={cn('size-3.5 transition-all duration-200', favorited && 'fill-current scale-110')} />
          </button>
        </div>
      </div>

      {/* ── CENTER: Info ─────────────────────────────────────────────────────── */}
      <div className="@container flex min-w-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">

        {/* 1 — Price + mobile-only Edit/Delete */}
        <div className="flex items-start justify-between gap-2">
          {price !== undefined ? (
            <p className="min-w-0 truncate text-[18px] font-extrabold leading-none tracking-tight text-foreground tabular-nums sm:text-[24px]">
              {fmtPrice(price)}
            </p>
          ) : (
            <p className="self-center text-[11px] italic text-muted-foreground/50">Price on request</p>
          )}
          <div className="flex shrink-0 items-center gap-1.5 sm:hidden" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Edit property"
              onClick={() => onEdit(property)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'border border-border/40 bg-muted/40 text-muted-foreground/55',
                'transition-all duration-150 active:scale-95',
                'hover:border-primary/20 hover:bg-primary/8 hover:text-primary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete property"
              onClick={() => onDelete(property)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'border border-border/40 bg-muted/40 text-muted-foreground/55',
                'transition-all duration-150 active:scale-95',
                'hover:border-rose-200/70 hover:bg-rose-50 hover:text-rose-500',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 2 — Reference + quality signals */}
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-[12px] font-semibold tracking-wide text-muted-foreground">
            {heading}
          </p>
          {hasIndicators && (
            <div className="flex shrink-0 items-center gap-1">
              <PropertyIndicatorPills
                isFeatured={isFeatured} isVerified={isVerified}
                isPremium={isPremium} isNewListing={isNewListing}
              />
            </div>
          )}
        </div>

        {/* 3 — Location */}
        {displayLocation && (
          <div className="mt-2 flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3 shrink-0 text-muted-foreground/40" />
            <span className="min-w-0 truncate text-[12px] font-medium text-muted-foreground/75">
              {displayLocation}
            </span>
          </div>
        )}

        {/* 4 — Property type — compact pill, 10px below location */}
        {type && (
          <div className="mt-2.5">
            <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full border border-primary/15 bg-primary/8 px-3 text-[12px] font-semibold tracking-wide text-primary">
              {type}
            </span>
          </div>
        )}

        {/* 5 — Unified action row: [Beds] [Baths] [Area] [View]                   */}
        {/* Chips are flex-1 (equal, compressible). View is shrink-0 (never         */}
        {/* pushed out). Both respond to @container center-column width:             */}
        {/*   <210px  → View icon-only (44px square)                                */}
        {/*   ≥210px  → View shows "View" text (auto-width, min 84px)               */}
        {/*   <320px  → chip labels hidden                                           */}
        {/*   ≥320px  → chip labels visible                                          */}
        <div
          className="mt-3 flex items-center gap-2 @[260px]:gap-3"
          onClick={e => e.stopPropagation()}
        >
          {bedroomCount !== undefined && (
            <StatChip Icon={BedDouble} value={bedroomCount}            label="Beds"  variant="list" />
          )}
          {bathroomCount !== undefined && (
            <StatChip Icon={Bath}      value={bathroomCount}           label="Baths" variant="list" />
          )}
          {square !== undefined && (
            <StatChip Icon={Maximize2} value={square.toLocaleString()} label="m²"   variant="list" />
          )}

          <button
            type="button"
            onClick={() => onView(property)}
            className={cn(
              'hidden sm:flex shrink-0 items-center justify-center',
              // narrow: icon-only square; wide: auto with "View" text
              'h-11 w-11 rounded-[12px] bg-primary',
              '@[210px]:w-auto @[210px]:min-w-21 @[210px]:gap-2 @[210px]:px-3.5',
              'text-[13px] font-semibold text-primary-foreground',
              'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_3px_10px_rgba(0,0,0,0.10)]',
              'transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_4px_14px_rgba(0,0,0,0.14)]',
              'active:translate-y-0 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            <Eye className="size-4 shrink-0" />
            <span className="hidden @[210px]:block">View</span>
          </button>
        </div>

      </div>

      {/* ── RIGHT: Actions panel — Delete / Edit only */}
      <div
        className={cn(
          'hidden sm:flex sm:w-9 sm:shrink-0 sm:flex-col sm:items-center sm:justify-start sm:gap-1',
          'sm:border-l sm:border-border/10 sm:py-4',
        )}
        onClick={e => e.stopPropagation()}
      >
        <QuickAction onClick={() => onDelete(property)} label="Delete property" Icon={Trash2} destructive />
        <QuickAction onClick={() => onEdit(property)}   label="Edit property"   Icon={Pencil} />
      </div>

    </div>
  )
})
