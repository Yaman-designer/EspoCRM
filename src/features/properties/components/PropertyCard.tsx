'use client'

import { useState, memo, type ComponentType } from 'react'
import Image from 'next/image'
import {
  BedDouble, Bath, MapPin, Maximize2,
  Pencil, Trash2, Heart, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, resolvePropertyImageId, FALLBACK_IMAGE } from '@/lib/image-url'
import { fmtPrice, getDisplayName, getDisplayLocation } from '../lib/display'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import { PropertyIndicatorPills } from './PropertyIndicators'
import type { RealEstateProperty } from '../types/property.types'

// ── Utility ───────────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

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
        'rounded-[12px] border border-border/50 bg-muted/40',
        // tight default; relax gap + padding when the center column has more room
        'gap-1 px-1.5 @[240px]:gap-1.5 @[240px]:px-2',
      )}>
        <Icon className="size-4 shrink-0 text-muted-foreground/80" />
        <span className="shrink-0 text-[13px] font-semibold leading-none tabular-nums text-foreground">{value}</span>
        {label && (
          // label is the first thing to disappear — hide below 320px center column
          <span className="hidden shrink-0 text-[13px] font-medium leading-none text-muted-foreground/70 @[320px]:block">
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
      'rounded-md border border-border/40 bg-muted/40 gap-1 px-1.5 py-1.5 text-[10px]',
      'sm:rounded-lg sm:border-border/50 sm:bg-muted/50 sm:gap-1 sm:px-2 sm:py-2 sm:text-[11px]',
    )}>
      <Icon className="size-3 shrink-0 text-muted-foreground/80" />
      <span className="shrink-0 font-bold tabular-nums text-foreground">{value}</span>
      {label && (
        <span className="hidden sm:inline shrink-0 font-medium text-muted-foreground/75">{label}</span>
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
          ? 'text-muted-foreground/35 hover:bg-destructive/10 hover:text-destructive'
          : 'text-muted-foreground/50 hover:bg-muted hover:text-foreground',
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

  const hasIndicators = !!(isFeatured || isVerified || isPremium || isNewListing)
  const heading       = propertyCode || displayName || '—'

  return (
    <article
      aria-label={heading}
      className={cn(
        'group flex h-full w-full min-w-0 cursor-default flex-col overflow-hidden rounded-[20px] bg-card',
        'border border-border/25',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.07)]',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:border-border/60 hover:ring-1 hover:ring-primary/12',
        'hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.10),0_24px_48px_rgba(0,0,0,0.08)]',
      )}
    >

      {/* ── Image ─────────────────────────────────────────────────────────────── */}
      {/* will-change-transform is on the container, not the Image.
          Moving it here ensures the overflow-hidden + border-radius clip
          lives on the same GPU compositing layer as its children, so the
          image scale animation cannot bleed past the rounded corners. */}
      <div className="relative aspect-square sm:aspect-4/3 w-full shrink-0 overflow-hidden rounded-t-[20px] bg-muted will-change-transform">
        <Image
          src={imgSrc}
          alt={heading}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover brightness-[1.02] contrast-[1.06] saturate-[1.08] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 639px) 50vw, (max-width: 871px) 33vw, (max-width: 1167px) 25vw, 20vw"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        {/* Gradient: subtle at top, atmospheric at bottom */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/72 via-black/12 to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.15)_100%)]" />

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
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200',
              favorited
                ? 'bg-rose-500 text-white shadow-[0_4px_14px_rgba(239,68,68,0.50)]'
                : 'bg-black/30 text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.20)] hover:scale-[1.05] hover:bg-black/45 hover:text-white',
            )}
          >
            <Heart className={cn('size-3.5 transition-transform duration-150', favorited && 'fill-current scale-110')} />
          </button>
        </div>

        {/* Price — glassmorphism badge, bottom-left */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
          {price != null ? (
            <div className="inline-flex items-center rounded-lg border border-white/28 bg-white/14 px-3.5 py-2 shadow-[0_2px_14px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-lg">
              <p className="truncate text-[18px] font-bold leading-none tracking-tight text-white tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.22)] sm:text-[22px]">
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
      <div className="flex flex-1 flex-col px-3 pb-2 pt-2.5">

        {/* Reference */}
        <p className="mb-1 min-w-0 truncate text-[13px] font-extrabold tracking-tight text-foreground tabular-nums sm:text-[20px]">
          {heading}
        </p>

        {/* Location */}
        {displayLocation && (
          <p className="mb-1 flex min-w-0 items-center gap-1 text-[10px] font-medium text-muted-foreground/65">
            <MapPin className="size-2.5 shrink-0 text-muted-foreground/45" />
            <span className="truncate">{displayLocation}</span>
          </p>
        )}

        {/* Property type chip — fit-content pill, left-aligned */}
        {type ? (
          <div className="mb-1.5">
            <span className="inline-flex cursor-default select-none items-center rounded-full border border-accent/50 bg-accent/80 px-2.5 py-1 text-[9.5px] font-semibold tracking-wider uppercase text-accent-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {toTitleCase(type)}
            </span>
          </div>
        ) : displayLocation ? (
          <div aria-hidden className="mb-1" />
        ) : (
          <div aria-hidden className="mb-1.5 h-3" />
        )}

        {/* Quality indicators */}
        {hasIndicators && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            <PropertyIndicatorPills
              isFeatured={isFeatured} isVerified={isVerified}
              isPremium={isPremium} isNewListing={isNewListing}
            />
          </div>
        )}

        {/* Stats chips — 3 chips on every card regardless of property type.
            "—" stands in for any unavailable value so layout never shifts. */}
        <div className="mb-1.5 h-px bg-border/25" />
        <div className="flex gap-1.5">
          <StatChip Icon={BedDouble} value={bedroomCount  ?? '—'}                        label="Beds"  variant="grid" />
          <StatChip Icon={Bath}      value={bathroomCount ?? '—'}                        label="Baths" variant="grid" />
          <StatChip Icon={Maximize2} value={square != null ? square.toLocaleString() : '—'} label="m²"   variant="grid" />
        </div>

      </div>

      {/* ── Footer action bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-border/20 bg-muted/30 px-2.5 py-1.5 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-1.5">

          {/* Details — primary CTA; flex-1 absorbs remaining space at any card width */}
          <button
            type="button"
            aria-label="View property details"
            onClick={() => onView(property)}
            className={cn(
              'group/det flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full transition-all duration-200',
              'h-11 border border-primary/30 bg-primary/8 px-2 text-primary sm:h-7',
              'hover:-translate-y-px hover:border-primary/45 hover:bg-primary/14 hover:shadow-[0_3px_10px_rgba(0,0,0,0.10)]',
              'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            <span className="text-[10.5px] font-semibold tracking-wide">Details</span>
            <ArrowRight className="size-3 shrink-0 transition-transform duration-200 ease-out group-hover/det:translate-x-1" />
          </button>

          {/* Edit — shrink-0 ensures it never gets squeezed out of view */}
          <button
            type="button"
            aria-label="Edit property"
            onClick={() => onEdit(property)}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-150 sm:h-8 sm:w-8',
              'text-muted-foreground/55 hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            <Pencil className="size-3.5" />
          </button>

          {/* Delete — shrink-0 ensures it is always fully visible */}
          <button
            type="button"
            aria-label="Delete property"
            onClick={() => onDelete(property)}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-150 sm:h-8 sm:w-8',
              'text-muted-foreground/50 hover:bg-destructive/8 hover:text-destructive',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            <Trash2 className="size-3.5" />
          </button>

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
        'group flex min-w-0 cursor-pointer overflow-hidden rounded-[20px] bg-card',
        'border border-border/30',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.07)]',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:border-border/55 hover:ring-1 hover:ring-primary/12',
        'hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.10),0_24px_48px_rgba(0,0,0,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
    >

      {/* ── LEFT: Image ─────────────────────────────────────────────────────── */}
      {/* w-36 (144px) mobile — never shrinks below 140px spec.                 */}
      {/* w-52 (208px) desktop — substantial visual hero.                       */}
      <div className="relative w-36 shrink-0 self-stretch overflow-hidden rounded-l-[20px] sm:w-52 will-change-transform">
        <Image
          src={imgSrc}
          alt={heading}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover brightness-[1.02] contrast-[1.06] saturate-[1.08] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
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
      {/* Two-column: content (flex-1) | actions (shrink-0).                    */}
      {/* Separating them removes the button-height inflation that was forcing   */}
      {/* ~74px of dead space between the price text and reference line.         */}
      <div className="@container flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 sm:px-4 sm:py-3">

        {/* Content column — pure vertical flow, height unaffected by buttons */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* 1 — Price */}
          {price != null ? (
            <p className="min-w-0 truncate text-[18px] font-extrabold leading-none tracking-tight text-foreground tabular-nums sm:text-[24px]">
              {fmtPrice(price)}
            </p>
          ) : (
            <p className="text-[11px] italic text-muted-foreground/50">Price on request</p>
          )}

          {/* 2 — Reference + quality signals — 4px below price */}
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="min-w-0 truncate text-[12px] font-bold tracking-wide text-muted-foreground">
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

          {/* 3 — Location — 6px below reference */}
          {displayLocation && (
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3 shrink-0 text-muted-foreground/50" />
              <span className="min-w-0 truncate text-[12px] font-medium text-muted-foreground/75">
                {displayLocation}
              </span>
            </div>
          )}

          {/* 4 — Property type — 8px below location */}
          {type && (
            <div className="mt-2">
              <span className="inline-flex cursor-default select-none items-center rounded-full border border-accent/60 bg-accent px-3 py-1 text-[11px] font-medium tracking-wide text-accent-foreground">
                {toTitleCase(type)}
              </span>
            </div>
          )}

          {/* 5 — Stats row */}
          {/* Mobile: vertical icon-above-value mini cards — horizontal chips can't
              fit in the ~107px content column (31.7px per chip → 19.7px inner after
              px-1.5 padding → clips even the size-4 icon alone). */}
          <div className="mt-2 flex gap-1 sm:hidden">
            {([
              { S: BedDouble,  v: bedroomCount  ?? '—'                               },
              { S: Bath,       v: bathroomCount ?? '—'                               },
              { S: Maximize2,  v: square != null ? square.toLocaleString() : '—'    },
            ] as { S: ComponentType<{ className?: string }>; v: React.ReactNode }[]).map(({ S: Stat, v }, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-muted/35 py-2"
              >
                <Stat className="size-3 shrink-0 text-muted-foreground/60" />
                <span className="text-[8.5px] font-bold tabular-nums leading-none text-foreground">
                  {v}
                </span>
              </div>
            ))}
          </div>
          {/* Desktop: horizontal stat chips with icon + value + label */}
          <div className="mt-2.5 hidden items-center gap-1.5 @[260px]:gap-2 sm:flex">
            <StatChip Icon={BedDouble} value={bedroomCount  ?? '—'}                           label="Beds"  variant="list" />
            <StatChip Icon={Bath}      value={bathroomCount ?? '—'}                           label="Baths" variant="list" />
            <StatChip Icon={Maximize2} value={square != null ? square.toLocaleString() : '—'} label="m²"    variant="list" />
          </div>

        </div>

        {/* Action buttons — aligned to start, never inflate content height */}
        <div className="flex shrink-0 flex-col gap-0.5" onClick={e => e.stopPropagation()}>
          <QuickAction onClick={() => onDelete(property)} label="Delete property" Icon={Trash2} destructive />
          <QuickAction onClick={() => onEdit(property)}   label="Edit property"   Icon={Pencil} />
        </div>

      </div>

    </div>
  )
})
