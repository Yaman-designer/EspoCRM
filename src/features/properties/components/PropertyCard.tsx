'use client'

import { useState, memo, type ComponentType } from 'react'
import Image from 'next/image'
import {
  BedDouble, Bath, MapPin, Maximize2,
  Eye, Pencil, Trash2, Copy, Heart,
  MoreHorizontal, Star, BadgeCheck, Gem, Sparkles,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, resolvePropertyImageId, FALLBACK_IMAGE } from '@/lib/image-url'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import type { RealEstateProperty } from '../types/property.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

// ── Desktop quick-action icon button ─────────────────────────────────────────

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
        'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150',
        destructive
          ? 'text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive'
          : 'text-muted-foreground/50 hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

// ── Mobile bottom-sheet action row ────────────────────────────────────────────

function SheetAction({
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
      className={cn(
        'flex min-h-13 w-full items-center gap-4 px-5 text-[15px] font-medium',
        'transition-colors duration-100 active:bg-muted/70',
        destructive ? 'text-destructive' : 'text-foreground',
      )}
    >
      <Icon
        className={cn(
          'size-4.5 shrink-0',
          destructive ? 'text-destructive/70' : 'text-muted-foreground',
        )}
      />
      {label}
    </button>
  )
}

// ── Listing quality indicator chip ────────────────────────────────────────────
// Rendered only when the property has a quality flag (Featured/Verified/etc.).
// Intentionally tiny — must never compete with Price or Title.

function IndicatorPill({
  icon: Icon,
  label,
  colorClass,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  colorClass: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-4.5 items-center gap-1 rounded-md border px-1.5',
        'text-[9.5px] font-semibold leading-none whitespace-nowrap',
        colorClass,
      )}
    >
      <Icon className="size-2.5 shrink-0" />
      {label}
    </span>
  )
}

// ── PropertyCard (grid view) ──────────────────────────────────────────────────
//
// Visual hierarchy (Price → Image → Title → Location → Details → Ref → Status):
//   1. Price — 22px font-black on image overlay, dominant
//   2. Image — 16:10 aspect, full-bleed
//   3. Title — 14px font-semibold, first in card body
//   4. Indicators — Featured/Verified/Premium/New (9.5px chips, never dominant)
//   5. Location — 11.5px muted
//   6. Property details — specs row
//   7. Ref code — 10px faint, in type+ref row
//   8. Status — neutral glass pill on image (non-competing)
//
// Mobile: 3-dot → bottom sheet. Actions: View / Edit / Delete only (no Duplicate).
// Desktop: hover action bar includes View / Edit / Duplicate / Delete.

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
  onDuplicate,
}: PropertyCardProps) {
  const {
    name, title, price, type, status,
    square, bedroomCount, bathroomCount,
    locationName, addressCity, propertyCode,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity

  const resolvedId = resolvePropertyImageId(mainImageId, imagesIds)
  const [imgSrc, setImgSrc]           = useState(() => getWebAssetUrl(resolvedId))
  const [favorited, setFavorited]     = useState(false)
  const [mobileSheet, setMobileSheet] = useState(false)
  const hasSpecs      = bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined
  const hasIndicators = !!(isFeatured || isVerified || isPremium || isNewListing)

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={displayName || 'Property'}
      className={cn(
        'group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-card',
        'border border-border/40',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-border/70',
        'hover:shadow-[0_12px_32px_rgba(0,0,0,0.13),0_4px_12px_rgba(0,0,0,0.07)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
      onClick={() => onView(property)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(property) } }}
    >

      {/* ── Image — 16:10 aspect ratio, full-bleed ────────────────────── */}
      <div className="relative aspect-8/5 w-full shrink-0 overflow-hidden bg-muted">
        <Image
          src={imgSrc}
          alt={displayName || 'Property'}
          fill
          unoptimized
          draggable={false}
          className="select-none object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.05]"
          sizes="(max-width: 639px) 50vw, (max-width: 871px) 33vw, (max-width: 1167px) 25vw, 20vw"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {/* Deepened gradient — price must read against any image */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/45 to-transparent" />

        {/* Status badge — neutral glass pill so it never competes with price */}
        <div className="absolute left-3 top-3 z-10">
          <PropertyStatusBadge status={status} variant="overlay" />
        </div>

        {/* Top-right controls: [⋮ mobile-only] [❤ always] */}
        <div
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="More actions"
            onClick={() => setMobileSheet(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/85 backdrop-blur-sm transition-colors duration-150 active:bg-black/55 sm:hidden"
          >
            <MoreHorizontal className="size-4" />
          </button>

          <button
            type="button"
            aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => setFavorited(f => !f)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200',
              favorited
                ? 'bg-rose-500 text-white shadow-[0_2px_10px_rgba(239,68,68,0.5)]'
                : 'bg-black/30 text-white/85 hover:bg-black/50 hover:text-white',
            )}
          >
            <Heart className={cn('size-3.5 transition-transform duration-150', favorited && 'fill-current scale-110')} />
          </button>
        </div>

        {/* Price — dominant element, anchored to bottom */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-3.5 pb-3">
          {price !== undefined ? (
            <p className="truncate text-[22px] font-black leading-none tracking-tight text-white tabular-nums [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
              {fmtPrice(price)}
            </p>
          ) : (
            <p className="text-[11px] font-medium italic text-white/55">
              Price on request
            </p>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-3.5 pt-2.5 pb-2.5">

        {/* 1. Title */}
        <h3 className="mb-0.5 line-clamp-1 min-w-0 text-sm font-semibold leading-snug text-foreground">
          {displayName || '—'}
        </h3>

        {/* 2. Listing quality indicators — subtle chips, never dominant */}
        {hasIndicators && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            {isFeatured && (
              <IndicatorPill icon={Star} label="Featured" colorClass="border-amber-200/70 bg-amber-50 text-amber-600" />
            )}
            {isVerified && (
              <IndicatorPill icon={BadgeCheck} label="Verified" colorClass="border-emerald-200/70 bg-emerald-50 text-emerald-600" />
            )}
            {isPremium && (
              <IndicatorPill icon={Gem} label="Premium" colorClass="border-violet-200/70 bg-violet-50 text-violet-600" />
            )}
            {isNewListing && (
              <IndicatorPill icon={Sparkles} label="New" colorClass="border-primary/15 bg-primary/8 text-primary" />
            )}
          </div>
        )}

        {/* 3. Type chip + Ref code (reference is metadata, not primary heading) */}
        <div className="mb-2 flex min-w-0 items-center gap-1.5">
          {type && (
            <span className="inline-flex shrink-0 items-center rounded-md bg-muted/80 px-1.5 py-px text-[10px] font-medium text-muted-foreground/70">
              {type}
            </span>
          )}
          {propertyCode && (
            <span className="min-w-0 truncate text-[10px] text-muted-foreground/40">
              Ref #{propertyCode}
            </span>
          )}
          {!type && !propertyCode && <div className="h-4" aria-hidden />}
        </div>

        {/* 4. Location */}
        {displayLocation ? (
          <p className="mb-2.5 flex min-w-0 items-center gap-1 text-[11.5px] text-muted-foreground">
            <MapPin className="size-3 shrink-0 text-brand-crimson/60" />
            <span className="truncate">{displayLocation}</span>
          </p>
        ) : (
          <div aria-hidden className="mb-2.5 h-4" />
        )}

        {/* 5. Specs — Beds / Baths / m² */}
        {hasSpecs && (
          <>
            <div className="mb-2 h-px bg-border/30" />
            <div className="flex min-w-0 items-center gap-3">
              {bedroomCount !== undefined && (
                <span className="flex items-center gap-1 text-[10.5px]">
                  <BedDouble className="size-3 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/80">{bedroomCount}</span>
                  <span className="text-muted-foreground/50">Beds</span>
                </span>
              )}
              {bathroomCount !== undefined && (
                <span className="flex items-center gap-1 text-[10.5px]">
                  <Bath className="size-3 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/80">{bathroomCount}</span>
                  <span className="text-muted-foreground/50">Baths</span>
                </span>
              )}
              {square !== undefined && (
                <span className="flex items-center gap-1 text-[10.5px]">
                  <Maximize2 className="size-3 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/80">{square.toLocaleString()}</span>
                  <span className="text-muted-foreground/50">m²</span>
                </span>
              )}
            </div>
          </>
        )}

        {/* 6. Desktop hover actions — View / Edit / [Duplicate] / Delete */}
        <div
          className="mt-auto hidden items-center justify-between border-t border-border/30 pt-2 sm:flex"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <QuickAction onClick={() => onView(property)}   label="View"      Icon={Eye} />
            <QuickAction onClick={() => onEdit(property)}   label="Edit"      Icon={Pencil} />
            {onDuplicate && (
              <QuickAction onClick={() => onDuplicate(property)} label="Duplicate" Icon={Copy} />
            )}
          </div>
          <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <QuickAction onClick={() => onDelete(property)} label="Delete" Icon={Trash2} destructive />
          </div>
        </div>

      </div>

      {/* ── Mobile action sheet (Radix portal — renders outside article DOM) ─ */}
      <Sheet open={mobileSheet} onOpenChange={setMobileSheet}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-hidden rounded-t-2xl p-0"
          showCloseButton={false}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="mx-auto mb-3 mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" />

          {/* Property preview — thumbnail + title + price + status + ref */}
          <div className="flex items-center gap-3.5 px-5 pb-4">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={imgSrc}
                alt={displayName || 'Property'}
                fill
                unoptimized
                className="object-cover"
                sizes="80px"
                onError={() => setImgSrc(FALLBACK_IMAGE)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                {displayName || 'Property'}
              </SheetTitle>
              {price !== undefined && (
                <p className="mt-0.5 truncate text-lg font-black tabular-nums tracking-tight text-primary">
                  {fmtPrice(price)}
                </p>
              )}
              <div className="mt-1.5">
                <PropertyStatusBadge status={status} />
              </div>
              {propertyCode && (
                <p className="mt-1 text-[10.5px] tabular-nums text-muted-foreground/50">
                  Ref #{propertyCode}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40" />

          {/* Actions — View / Edit / [separator] / Delete (no Duplicate on mobile) */}
          <div className="flex flex-col">
            <SheetAction
              label="View Property"
              Icon={Eye}
              onClick={() => { setMobileSheet(false); onView(property) }}
            />
            <SheetAction
              label="Edit Property"
              Icon={Pencil}
              onClick={() => { setMobileSheet(false); onEdit(property) }}
            />
            <div className="mx-5 h-px bg-border/40" />
            <SheetAction
              label="Delete Property"
              Icon={Trash2}
              destructive
              onClick={() => { setMobileSheet(false); onDelete(property) }}
            />
          </div>

          {/* iOS safe-area bottom spacing */}
          <div className="h-6" />
        </SheetContent>
      </Sheet>

    </article>
  )
})


// ── PropertyListRow (list-view variant) ──────────────────────────────────────
//
// Layout: [Thumbnail 80×120] [Info: title, ref, location] [Specs: sm+] [Price + Status] [Actions]
//
// Mobile: 3-dot → bottom sheet.
// Sheet header: thumbnail + title + price + status + ref (same structure as grid card sheet).
// Actions: View / Edit / Delete only (no Duplicate on mobile).

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
  onDuplicate,
}: PropertyListRowProps) {
  const {
    name, title, price, type, status,
    square, bedroomCount, bathroomCount,
    locationName, addressCity, propertyCode,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity
  const hasSpecs        = bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined
  const hasIndicators   = !!(isFeatured || isVerified || isPremium || isNewListing)

  const [imgSrc, setImgSrc]           = useState(() => getWebAssetUrl(resolvePropertyImageId(mainImageId, imagesIds)))
  const [mobileSheet, setMobileSheet] = useState(false)

  return (
    <>
      <div
        tabIndex={0}
        role="button"
        aria-label={displayName || 'Property'}
        onClick={() => onView(property)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(property) } }}
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-3',
          'border border-border/40',
          'shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]',
          'transition-all duration-200 ease-out',
          'hover:-translate-y-px hover:border-border/70',
          'hover:shadow-[0_6px_20px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-30 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            src={imgSrc}
            alt={displayName || 'Property'}
            fill
            unoptimized
            draggable={false}
            className="select-none object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.05]"
            sizes="120px"
            loading="lazy"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {type && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
              <div className="absolute bottom-1.5 left-1.5">
                <span className="rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  {type}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Property info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {displayName || '—'}
          </p>
          {propertyCode && (
            <p className="text-[10px] tabular-nums text-muted-foreground/40">
              Ref #{propertyCode}
            </p>
          )}
          {displayLocation && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-2.5 shrink-0 text-brand-crimson/50" />
              <span className="truncate">{displayLocation}</span>
            </p>
          )}
          {hasIndicators && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {isFeatured && (
                <IndicatorPill icon={Star} label="Featured" colorClass="border-amber-200/70 bg-amber-50 text-amber-600" />
              )}
              {isVerified && (
                <IndicatorPill icon={BadgeCheck} label="Verified" colorClass="border-emerald-200/70 bg-emerald-50 text-emerald-600" />
              )}
              {isPremium && (
                <IndicatorPill icon={Gem} label="Premium" colorClass="border-violet-200/70 bg-violet-50 text-violet-600" />
              )}
              {isNewListing && (
                <IndicatorPill icon={Sparkles} label="New" colorClass="border-primary/15 bg-primary/8 text-primary" />
              )}
            </div>
          )}
        </div>

        {/* Specs — visible on sm+ */}
        {hasSpecs && (
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            {bedroomCount !== undefined && (
              <span className="flex items-center gap-1 text-[11px]">
                <BedDouble className="size-3 text-muted-foreground/50" />
                <span className="font-semibold tabular-nums text-foreground/75">{bedroomCount}</span>
                <span className="text-muted-foreground/50">Beds</span>
              </span>
            )}
            {bathroomCount !== undefined && (
              <span className="flex items-center gap-1 text-[11px]">
                <Bath className="size-3 text-muted-foreground/50" />
                <span className="font-semibold tabular-nums text-foreground/75">{bathroomCount}</span>
                <span className="text-muted-foreground/50">Baths</span>
              </span>
            )}
            {square !== undefined && (
              <span className="flex items-center gap-1 text-[11px]">
                <Maximize2 className="size-3 text-muted-foreground/50" />
                <span className="font-semibold tabular-nums text-foreground/75">{square.toLocaleString()}</span>
                <span className="text-muted-foreground/50">m²</span>
              </span>
            )}
          </div>
        )}

        {/* Price + Status */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {price !== undefined ? (
            <span className="whitespace-nowrap text-[15px] font-black tabular-nums tracking-tight text-foreground">
              {fmtPrice(price)}
            </span>
          ) : (
            <span className="text-[11px] italic text-muted-foreground/50">POA</span>
          )}
          <PropertyStatusBadge status={status} />
        </div>

        {/* Desktop quick actions — View / Edit / [Duplicate] / Delete */}
        <div
          className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex"
          onClick={e => e.stopPropagation()}
        >
          <QuickAction onClick={() => onView(property)}   label="View"      Icon={Eye} />
          <QuickAction onClick={() => onEdit(property)}   label="Edit"      Icon={Pencil} />
          {onDuplicate && (
            <QuickAction onClick={() => onDuplicate(property)} label="Duplicate" Icon={Copy} />
          )}
          <QuickAction onClick={() => onDelete(property)} label="Delete" Icon={Trash2} destructive />
        </div>

        {/* Mobile: 3-dot → Sheet */}
        <div className="shrink-0 sm:hidden" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label="Property actions"
            onClick={() => setMobileSheet(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/70 text-muted-foreground/60 transition-all duration-150 active:bg-muted"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile action sheet */}
      <Sheet open={mobileSheet} onOpenChange={setMobileSheet}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-hidden rounded-t-2xl p-0"
          showCloseButton={false}
          onClick={e => e.stopPropagation()}
        >
          <div className="mx-auto mb-3 mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" />

          {/* Property preview — thumbnail + title + price + status + ref */}
          <div className="flex items-center gap-3.5 px-5 pb-4">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={imgSrc}
                alt={displayName || 'Property'}
                fill
                unoptimized
                className="object-cover"
                sizes="80px"
                onError={() => setImgSrc(FALLBACK_IMAGE)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                {displayName || 'Property'}
              </SheetTitle>
              {price !== undefined && (
                <p className="mt-0.5 text-lg font-black tabular-nums tracking-tight text-primary">
                  {fmtPrice(price)}
                </p>
              )}
              <div className="mt-1.5">
                <PropertyStatusBadge status={status} />
              </div>
              {propertyCode && (
                <p className="mt-1 text-[10.5px] tabular-nums text-muted-foreground/50">
                  Ref #{propertyCode}
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border/40" />

          {/* Actions — View / Edit / [separator] / Delete (no Duplicate on mobile) */}
          <div className="flex flex-col">
            <SheetAction
              label="View Property"
              Icon={Eye}
              onClick={() => { setMobileSheet(false); onView(property) }}
            />
            <SheetAction
              label="Edit Property"
              Icon={Pencil}
              onClick={() => { setMobileSheet(false); onEdit(property) }}
            />
            <div className="mx-5 h-px bg-border/40" />
            <SheetAction
              label="Delete Property"
              Icon={Trash2}
              destructive
              onClick={() => { setMobileSheet(false); onDelete(property) }}
            />
          </div>

          <div className="h-6" />
        </SheetContent>
      </Sheet>
    </>
  )
})
