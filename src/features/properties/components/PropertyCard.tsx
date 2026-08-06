'use client'

import { useState, memo, type ComponentType } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import {
  BedDouble, Bath, MapPin, Maximize2,
  Pencil, Trash2, Heart, ArrowRight, Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, resolvePropertyImageId, FALLBACK_IMAGE } from '@/lib/image-url'
import { fmtPrice, getDisplayName, getDisplayLocation } from '../lib/display'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import { PropertyIndicatorPills } from './PropertyIndicators'
import { useFavoriteState } from '../hooks/useFavoriteState'
import { IconActionButton } from '@/components/shared/IconActionButton'
import { getPropertyTypeLabel } from '../domain/property-type.registry'
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
        'rounded-xl border border-border/50 bg-muted/40',
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
      'min-w-0 flex-1 overflow-hidden',
      'flex flex-row items-center justify-center gap-1.5 rounded-xl border border-border/25 bg-muted/45 py-2.5 px-1',
      'sm:h-auto sm:gap-1 sm:rounded-lg sm:border-border/50 sm:bg-muted/50 sm:py-2 sm:shadow-none sm:text-[11px]',
    )}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground/55 sm:size-3 sm:text-muted-foreground/80" />
      <span className="shrink-0 text-[13px] font-bold leading-none tabular-nums text-foreground sm:text-[11px] sm:font-bold">{value}</span>
      {label && (
        <span className="shrink-0 text-[9.5px] font-medium leading-none text-muted-foreground/50 sm:text-[11px] sm:font-medium sm:normal-case sm:tracking-normal sm:text-muted-foreground/75">{label}</span>
      )}
    </div>
  )
}

// ── PropertyCard (grid view) ──────────────────────────────────────────────────
//
// Mobile scan order:  Image → Price (content) → Type → Location → ID → Stats → CTA
// Desktop scan order: Image (with price badge) → ID → Location → Type → Stats → CTA
//
// Mobile:  4:3 hero image. Price as dominant 26px text in content. Premium
//          columnar stats (value/label separated by hairlines). h-12 CTA.
// Desktop: Price badge on image. Outlined CTA. Ghost icon buttons.

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
  const { t } = useTranslation('properties')
  const {
    price, type, status,
    square, bedroomCount, bathroomCount,
    propertyCode,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
  } = property

  const displayName     = getDisplayName(property)
  const displayLocation = getDisplayLocation(property)

  const resolvedId = resolvePropertyImageId(mainImageId, imagesIds)
  const [imgSrc, setImgSrc]           = useState(() => getWebAssetUrl(resolvedId))
  const { favorited, toggle: toggleFav } = useFavoriteState(property.id)

  const hasIndicators = !!(isFeatured || isVerified || isPremium || isNewListing)
  const heading       = propertyCode || displayName || '—'
  const totalImages   = imagesIds?.length ?? 0

  return (
    <article
      aria-label={heading}
      className={cn(
        'group flex h-full w-full min-w-0 cursor-default flex-col overflow-hidden rounded-2xl bg-card',
        'border border-border/10 sm:border-border/15',
        // Mobile shadow: soft, low-contrast three-layer depth + inset top highlight
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05),0_12px_28px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.06)] sm:shadow-[0_1px_2px_rgba(0,0,0,0.03),0_3px_8px_rgba(0,0,0,0.035),0_8px_20px_rgba(0,0,0,0.04)]',
        'transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'active:scale-[0.985] active:shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05)] sm:active:scale-100',
        'hover:-translate-y-[3px] hover:border-border/30',
        'hover:shadow-[0_6px_20px_rgba(0,0,0,0.04),0_20px_48px_rgba(0,0,0,0.05),0_40px_80px_rgba(0,0,0,0.04)]',
      )}
    >

      {/* ── Image — 4:3 hero on mobile, deeper zoom on hover ─────────────────── */}
      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-t-2xl bg-muted">
        <Image
          src={imgSrc}
          alt={heading}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover brightness-[1.03] contrast-[1.04] saturate-[1.10] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 100vw, (max-width: 871px) 33vw, (max-width: 1167px) 25vw, 20vw"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {/* Top ambient scrim — just enough for badge/button legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/28 to-transparent" />

        {/* Bottom atmospheric gradient — richer on mobile for depth; dense on desktop for price badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/35 via-black/12 to-transparent sm:h-28 sm:from-black/65 sm:via-black/25 sm:to-transparent" />

        {/* Photo count — mobile only, bottom-right, shows when there are multiple images */}
        {totalImages > 1 && (
          <div className="absolute bottom-3 right-3 z-10 sm:hidden">
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/65 px-2.5 py-1">
              <Camera className="size-2.5 text-white/75" />
              <span className="text-[10px] font-semibold leading-none tabular-nums text-white">{totalImages}</span>
            </div>
          </div>
        )}

        {/* Status badge — top-left */}
        <div className="absolute left-3 top-3 z-10">
          <PropertyStatusBadge status={status} variant="overlay" compact />
        </div>

        {/* Favourite — top-right, glass morphism (not a dark blob). Button
            System Variant 3 (Icon Action), 'glass' surface. */}
        <div className="absolute right-3 top-3 z-10" onClick={e => e.stopPropagation()}>
          <IconActionButton
            icon={Heart}
            label={favorited ? t('card.removeFromFavourites') : t('card.addToFavourites')}
            onClick={toggleFav}
            surface="glass"
            active={favorited}
            size="sm"
            className="sm:h-8 sm:w-8 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            iconClassName="size-4 sm:size-3.5"
          />
        </div>

        {/* Price badge — desktop only. Mobile price lives in the content area.

            Uses backdrop-blur intentionally.
            This is the only permanent compositor layer in the card.
            Do not remove unless replacing the frosted-glass design.
            Unlike the previous image-wrapper bug, this element is
            inset from the rounded clipping edge and therefore
            cannot produce compositor seam artifacts during scrolling. */}
        {price != null ? (
          <div className="absolute inset-x-0 bottom-0 z-10 hidden px-3 pb-3 sm:block">
            <div className="inline-flex items-center rounded-xl border border-white/18 bg-gray-400/25 px-3.5 py-2 shadow-[0_2px_16px_rgba(0,0,0,0.32)] backdrop-blur-md">
              <p className="truncate text-[22px] font-bold leading-none tracking-tight text-white tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]">
                {fmtPrice(price)}
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 z-10 hidden px-3 pb-3 sm:block">
            <div className="inline-flex items-center rounded-2xl border border-white/15 bg-white/18 px-3 py-1.5">
              <p className="text-[11px] font-medium italic text-white/60">{t('card.priceOnRequest')}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────────── */}
      {/* flex-col + CSS order: children resequence between mobile and desktop     */}
      {/* without DOM changes. Default order (mobile): 0→1→2→3→4→5→6             */}
      {/* sm: order (desktop):  1(ID)→2(loc)→3(type)→4(ind)→5(div)→6(stats)      */}
      <div className="flex flex-1 flex-col px-4 pb-0 pt-4 sm:px-3 sm:pb-1.5 sm:pt-2.5">

        {/* Price — mobile hero; order:0 so it precedes all ordered children */}
        <div className="mb-4 sm:hidden">
          {price != null ? (
            <p className="min-w-0 truncate text-[28px] font-black leading-none tracking-[-0.02em] text-foreground tabular-nums">
              {fmtPrice(price)}
            </p>
          ) : (
            <p className="text-[13px] italic text-muted-foreground/70">{t('card.priceOnRequest')}</p>
          )}
        </div>

        {/* Property type — mobile: understated luxury label; desktop: accent chip */}
        {type ? (
          <div className="order-1 mb-2 sm:order-3 sm:mb-1.5">
            <span className="inline-flex cursor-default select-none items-center whitespace-nowrap rounded-full border border-foreground/14 bg-transparent px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-widest text-foreground/70 sm:border-accent/40 sm:bg-accent/60 sm:px-2.5 sm:py-1 sm:text-[9px] sm:font-semibold sm:uppercase sm:tracking-widest sm:text-accent-foreground">
              {getPropertyTypeLabel(type, t, { compact: true })}
            </span>
          </div>
        ) : displayLocation ? (
          <div aria-hidden className="order-1 mb-2 sm:order-3 sm:mb-1" />
        ) : (
          <div aria-hidden className="order-1 mb-2 h-6 sm:order-3 sm:mb-1.5" />
        )}

        {/* Reference — mobile: compact agent code (order-2); desktop: primary heading (order-1) */}
        <div className="order-2 mb-1.5 min-w-0 sm:order-1 sm:mb-1">
          <span className="block max-w-full truncate text-[10.5px] font-semibold tracking-wider text-muted-foreground/75 tabular-nums sm:hidden">
            {heading}
          </span>
          <p className="hidden min-w-0 truncate text-[19px] font-bold tracking-tight text-foreground sm:block">
            {heading}
          </p>
        </div>

        {/* Location */}
        {displayLocation && (
          <p className="order-3 mb-2 flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground/75 sm:order-2 sm:mb-1 sm:gap-1 sm:text-[10px] sm:text-muted-foreground/70">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground/50 sm:size-2.5 sm:text-muted-foreground/40" />
            <span className="truncate">{displayLocation}</span>
          </p>
        )}

        {/* Quality indicators */}
        {hasIndicators && (
          <div className="order-4 mb-2 flex flex-wrap items-center gap-1 sm:order-4 sm:mb-1.5">
            <PropertyIndicatorPills
              isFeatured={isFeatured} isVerified={isVerified}
              isPremium={isPremium} isNewListing={isNewListing}
            />
          </div>
        )}

        {/* Divider */}
        <div className="order-5 mb-3 h-px bg-border/22 sm:order-5 sm:mb-1.5 sm:bg-border/25" />

        {/* Stats — mobile: grouped container with hairline separators */}
        <div className="order-6 overflow-hidden rounded-2xl border border-border/20 bg-muted/25 flex items-stretch sm:hidden">
          <div className="flex flex-1 flex-col items-center justify-center py-1.5">
            <span className="text-[15px] font-bold leading-none tabular-nums text-foreground">{bedroomCount ?? '—'}</span>
            <div className="mt-1.5 flex items-center gap-0.5">
              <BedDouble className="size-3 text-muted-foreground/45" />
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/50">{t('card.beds')}</span>
            </div>
          </div>
          <div className="w-px self-stretch bg-border/30" />
          <div className="flex flex-1 flex-col items-center justify-center py-1.5">
            <span className="text-[15px] font-bold leading-none tabular-nums text-foreground">{bathroomCount ?? '—'}</span>
            <div className="mt-1.5 flex items-center gap-0.5">
              <Bath className="size-3 text-muted-foreground/45" />
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/50">{t('card.baths')}</span>
            </div>
          </div>
          <div className="w-px self-stretch bg-border/30" />
          <div className="flex flex-1 flex-col items-center justify-center py-1.5">
            <span className="text-[15px] font-bold leading-none tabular-nums text-foreground">{square != null ? square.toLocaleString() : '—'}</span>
            <div className="mt-1.5 flex items-center gap-0.5">
              <Maximize2 className="size-3 text-muted-foreground/45" />
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground/50">{t('common.sqmUnit')}</span>
            </div>
          </div>
        </div>

        {/* Stats — desktop: StatChip row */}
        <div className="order-6 hidden gap-1.5 sm:flex">
          <StatChip Icon={BedDouble} value={bedroomCount  ?? '—'}                           label={t('card.beds')}  variant="grid" />
          <StatChip Icon={Bath}      value={bathroomCount ?? '—'}                           label={t('card.baths')} variant="grid" />
          <StatChip Icon={Maximize2} value={square != null ? square.toLocaleString() : '—'} label={t('common.sqmUnit')}   variant="grid" />
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      {/* Mobile: seamless (no border, no bg) — CTA feels native to card body    */}
      {/* Desktop: muted separator bar, compact ghost buttons                     */}
      <div className="px-4 pb-4 pt-3 sm:border-t sm:border-border/18 sm:bg-muted/18 sm:px-2.5 sm:py-2">
        <div className="flex items-center gap-2 sm:gap-1.5">

          {/* Details — h-12 primary CTA on mobile; sm: compact outlined ghost */}
          <button
            type="button"
            aria-label={t('card.viewPropertyDetails')}
            onClick={() => onView(property)}
            className={cn(
              'group/det flex min-w-0 flex-1 items-center justify-center gap-2 transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'h-12 rounded-2xl bg-primary px-3 text-primary-foreground shadow-[0_2px_12px_rgba(59,130,246,0.28)] sm:h-7 sm:rounded-full sm:border sm:border-primary/30 sm:bg-primary/8 sm:text-primary sm:shadow-none',
              'hover:bg-primary/90 sm:hover:-translate-y-px sm:hover:border-primary/45 sm:hover:bg-primary/14 sm:hover:shadow-[0_3px_10px_rgba(0,0,0,0.10)]',
              'active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            <span className="text-[14px] font-semibold tracking-wide sm:text-[10.5px] sm:font-semibold">{t('card.viewProperty')}</span>
            <ArrowRight className="size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/det:translate-x-0.5 sm:size-3" />
          </button>

          {/* Edit / Delete — Button System Variant 3 (Icon Action), 'card'
              surface, 'lg' size (mobile footer, beside the Primary CTA)
              shrinking to the standard 'sm' desktop size via className. */}
          <IconActionButton
            icon={Pencil}
            label={t('card.editProperty')}
            onClick={() => onEdit(property)}
            size="lg"
            className="sm:h-8 sm:w-8 sm:rounded-full sm:bg-transparent sm:text-muted-foreground/55 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            iconClassName="sm:size-3.5"
          />

          <IconActionButton
            icon={Trash2}
            label={t('card.deleteProperty')}
            onClick={() => onDelete(property)}
            size="lg"
            tone="destructive"
            className="sm:h-8 sm:w-8 sm:rounded-full sm:bg-transparent sm:text-muted-foreground/50 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            iconClassName="sm:size-3.5"
          />

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
  const { t } = useTranslation('properties')
  const {
    price, type, status,
    square, bedroomCount, bathroomCount,
    propertyCode,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
  } = property

  const displayName     = getDisplayName(property)
  const displayLocation = getDisplayLocation(property)

  const hasIndicators = !!(isFeatured || isVerified || isPremium || isNewListing)
  const heading       = propertyCode || displayName || '—'

  const [imgSrc, setImgSrc]           = useState(() => getWebAssetUrl(resolvePropertyImageId(mainImageId, imagesIds)))
  const { favorited, toggle: toggleFav } = useFavoriteState(property.id)

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
        'transition-[transform,border-color,box-shadow] duration-200 ease-out',
        'hover:-translate-y-1 hover:border-border/55 hover:ring-1 hover:ring-primary/12',
        'hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.10),0_24px_48px_rgba(0,0,0,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
    >

      {/* ── LEFT: Image ─────────────────────────────────────────────────────── */}
      {/* w-36 (144px) mobile — never shrinks below 140px spec.                 */}
      {/* w-52 (208px) desktop — substantial visual hero.                       */}
      <div className="relative w-36 shrink-0 self-stretch overflow-hidden rounded-l-[20px] sm:w-52">
        <Image
          src={imgSrc}
          alt={heading}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover brightness-[1.02] contrast-[1.06] saturate-[1.08] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 639px) 144px, 208px"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/55" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.12)_100%)]" />

        {/* Status — bottom-left */}
        <div className="absolute bottom-3 left-3 z-10">
          <PropertyStatusBadge status={status} variant="overlay" compact />
        </div>

        {/* Favourite — top-right. Button System Variant 3 (Icon Action),
            'glass' surface — same component and press/hover behavior as the
            grid card's Favorite, so a toggle that appears in both views
            doesn't feel like two different controls. */}
        <div className="absolute right-2.5 top-2.5 z-10" onClick={e => e.stopPropagation()}>
          <IconActionButton
            icon={Heart}
            label={favorited ? t('card.removeFromFavourites') : t('card.addToFavourites')}
            onClick={toggleFav}
            surface="glass"
            active={favorited}
            size="sm"
            className="h-8 w-8"
            iconClassName="size-3.5"
          />
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
            <p className="text-[11px] italic text-muted-foreground/50">{t('card.priceOnRequest')}</p>
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
                {getPropertyTypeLabel(type, t, { compact: true })}
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
            <StatChip Icon={BedDouble} value={bedroomCount  ?? '—'}                           label={t('card.beds')}  variant="list" />
            <StatChip Icon={Bath}      value={bathroomCount ?? '—'}                           label={t('card.baths')} variant="list" />
            <StatChip Icon={Maximize2} value={square != null ? square.toLocaleString() : '—'} label={t('common.sqmUnit')}    variant="list" />
          </div>

        </div>

        {/* Action buttons — aligned to start, never inflate content height.
            Button System Variant 3 (Icon Action), 'card' surface — fixed at
            32px ('sm' size, h-8 w-8 override) to match Favorite above and
            the grid card's own desktop-tier icon actions, resolving what was
            previously a 32px-Favorite-vs-36px-Edit/Delete mismatch inside
            this same row. */}
        <div className="flex shrink-0 flex-col gap-0.5" onClick={e => e.stopPropagation()}>
          <IconActionButton
            icon={Trash2}
            label={t('card.deleteProperty')}
            onClick={() => onDelete(property)}
            size="sm"
            tone="destructive"
            className="h-8 w-8"
          />
          <IconActionButton
            icon={Pencil}
            label={t('card.editProperty')}
            onClick={() => onEdit(property)}
            size="sm"
            className="h-8 w-8"
          />
        </div>

      </div>

    </div>
  )
})

