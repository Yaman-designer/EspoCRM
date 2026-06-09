'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import {
  BedDouble, Bath, MapPin, Maximize2,
  MoreHorizontal, Eye, Pencil, Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

// Labels shown alongside the price for non-Available/non-Draft statuses
const PRICE_CONTEXT: Record<string, { label: string; cls: string }> = {
  Sold:             { label: 'Sold',        cls: 'bg-brand-crimson-soft  text-brand-crimson    border-brand-crimson/25'  },
  Rented:           { label: 'Rented',      cls: 'bg-brand-teal-soft    text-brand-teal       border-brand-teal/25'     },
  Pending:          { label: 'Under Offer', cls: 'bg-amber-50           text-amber-700        border-amber-200'          },
  'Under Approval': { label: 'In Review',   cls: 'bg-orange-50          text-orange-700       border-orange-200'         },
  Draft:            { label: 'Draft',       cls: 'bg-secondary          text-muted-foreground border-border/60'          },
}

// ── CardMenu ──────────────────────────────────────────────────────────────────

interface CardMenuProps {
  property:      RealEstateProperty
  onView:        (p: RealEstateProperty) => void
  onEdit:        (p: RealEstateProperty) => void
  onDelete:      (p: RealEstateProperty) => void
  triggerClass?: string
}

function CardMenu({ property, onView, onEdit, onDelete, triggerClass }: CardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          aria-label="Property actions"
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25',
            triggerClass ??
              'bg-card/85 text-muted-foreground/60 backdrop-blur-sm hover:bg-card hover:text-foreground shadow-sm',
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={e => { e.stopPropagation(); onView(property) }}
          className="gap-2 text-[13px]"
        >
          <Eye className="size-3.5 text-muted-foreground" />
          View Property
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={e => { e.stopPropagation(); onEdit(property) }}
          className="gap-2 text-[13px]"
        >
          <Pencil className="size-3.5 text-muted-foreground" />
          Edit Property
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={e => { e.stopPropagation(); onDelete(property) }}
          className="gap-2 text-[13px] text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Delete Property
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── PropertyCard (grid view) ──────────────────────────────────────────────────
//
// Layout contract
// ───────────────
// • Image:   edge-to-edge, 16:10 aspect ratio (aspect-8/5).
//            Status badge + menu sit in the image overlay.
// • Content: p-3 section below the image.
//   1. Type badge + property code  (optional row, shown if either exists)
//   2. Title                       (line-clamp-2, break-words, min-w-0)
//   3. Price block                 (own column — badge stacked below so price
//                                   always occupies the full width with no
//                                   horizontal competition from the badge)
//   4. Location                    (icon + single-line truncated text)
//   5. Divider + specs row         (shrink-0 items, overflow-hidden on container)

interface PropertyCardProps {
  property: RealEstateProperty
  onView:   (p: RealEstateProperty) => void
  onEdit:   (p: RealEstateProperty) => void
  onDelete: (p: RealEstateProperty) => void
}

export const PropertyCard = memo(function PropertyCard({
  property,
  onView,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const {
    name, title, price, type, status,
    square, bedroomCount, bathroomCount,
    locationName, addressCity, propertyCode,
    mainImageId, imagesIds,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity

  const resolvedId = resolvePropertyImageId(mainImageId, imagesIds)
  const [imgSrc, setImgSrc] = useState(() => getWebAssetUrl(resolvedId))
  const priceCtx = PRICE_CONTEXT[status]
  const hasSpecs = bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined

  return (
    <article
      className={cn(
        // h-full: equal height within each grid row (CSS Grid row alignment)
        // overflow-hidden: clips image to card's border-radius at top corners
        // w-full min-w-0: fill the column, prevent content from overflowing the cell
        'group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-card',
        'border border-border/50 shadow-design-sm',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:border-border/80 hover:shadow-design-lg',
      )}
      onClick={() => onView(property)}
    >

      {/* ── Image: 16:10, edge-to-edge ──────────────────────────────────── */}
      {/* aspect-ratio via inline style: next/image fill measures offsetHeight at mount
          time (before the CSS file is parsed in dev mode) — inline style is always
          present at render time so the container always has a non-zero height.        */}
      <div
        className="relative w-full shrink-0 overflow-hidden bg-muted"
        style={{ aspectRatio: '8/5' }}
      >
        <Image
          src={imgSrc}
          alt={displayName || 'Property'}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.04]"
          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1535px) 25vw, 20vw"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {/* Gradient: darkens top of image so overlaid badges stay readable */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/52 via-black/5 to-transparent" />

        {/* Status badge — top-left overlay */}
        <div className="absolute left-2.5 top-2.5 z-10">
          <PropertyStatusBadge status={status} variant="overlay" />
        </div>

        {/* Context menu — top-right overlay */}
        <div
          className="absolute right-2.5 top-2.5 z-10"
          onClick={e => e.stopPropagation()}
        >
          <CardMenu
            property={property}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            triggerClass="bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3">

        {/* ── 1. Type badge + property code ─────────────────────────────── */}
        {/* Shown only when at least one is present. Badge is left-aligned,
            code is right-aligned and truncates so it can never overflow. */}
        {(type || propertyCode) && (
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
            {type ? (
              <span className="inline-flex shrink-0 items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {type}
              </span>
            ) : (
              <span />
            )}
            {propertyCode && (
              <span className="min-w-0 truncate text-right font-mono text-[9.5px] text-muted-foreground/45">
                {propertyCode}
              </span>
            )}
          </div>
        )}

        {/* ── 2. Title ──────────────────────────────────────────────────── */}
        {/* min-w-0 prevents the flex child from overflowing its container.
            line-clamp-2 keeps the card height predictable. */}
        <h3 className="mb-2 line-clamp-2 min-w-0 wrap-break-word text-[13.5px] font-semibold leading-snug text-foreground">
          {displayName || property.id}
        </h3>

        {/* ── 3. Price block ─────────────────────────────────────────────── */}
        {/* Vertical stack so the price owns the full card width — no badge
            competing horizontally. Context badge sits below the price.
            overflow-hidden on the wrapper clips any extreme edge-case overflow
            without breaking the card's box model. */}
        <div className="mb-2 min-w-0 overflow-hidden">
          {price !== undefined ? (
            <p className="truncate text-[17px] font-bold leading-tight tracking-tight text-foreground tabular-nums md:text-[19px]">
              {fmtPrice(price)}
            </p>
          ) : (
            <p className="text-[12px] font-medium italic text-muted-foreground/55">
              Price on request
            </p>
          )}
          {priceCtx && (
            <span className={cn(
              'mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5',
              'whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wide',
              priceCtx.cls,
            )}>
              {priceCtx.label}
            </span>
          )}
        </div>

        {/* ── 4. Location ───────────────────────────────────────────────── */}
        {/* Icon is shrink-0 so it never collapses. Text truncates with ellipsis. */}
        {displayLocation ? (
          <p className="flex min-w-0 items-center gap-1 text-[11.5px] text-muted-foreground">
            <MapPin className="size-3 shrink-0 text-brand-crimson/55" />
            <span className="truncate">{displayLocation}</span>
          </p>
        ) : (
          <div aria-hidden className="h-[18px]" />
        )}

        {/* ── 5. Specs row ──────────────────────────────────────────────── */}
        {/* overflow-hidden + shrink-0 on each spec: row stays one line even
            when all three specs are present, clips gracefully if card is tiny. */}
        {hasSpecs && (
          <>
            <div className="my-2.5 h-px bg-border/50" />
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              {bedroomCount !== undefined && (
                <span className="flex shrink-0 items-center gap-1 text-[11px]">
                  <BedDouble className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/85">{bedroomCount}</span>
                </span>
              )}
              {bathroomCount !== undefined && (
                <span className="flex shrink-0 items-center gap-1 text-[11px]">
                  <Bath className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/85">{bathroomCount}</span>
                </span>
              )}
              {square !== undefined && (
                <span className="flex shrink-0 items-center gap-1 text-[11px]">
                  <Maximize2 className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/85">
                    {square.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">m²</span>
                </span>
              )}
            </div>
          </>
        )}

      </div>
    </article>
  )
})


// ── PropertyListRow (list-view variant) — unchanged ──────────────────────────

interface PropertyListRowProps {
  property: RealEstateProperty
  onView:   (p: RealEstateProperty) => void
  onEdit:   (p: RealEstateProperty) => void
  onDelete: (p: RealEstateProperty) => void
}

export const PropertyListRow = memo(function PropertyListRow({
  property,
  onView,
  onEdit,
  onDelete,
}: PropertyListRowProps) {
  const {
    name, title, price, type, status,
    square, bedroomCount, bathroomCount,
    locationName, addressCity,
    mainImageId, imagesIds,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity

  const [imgSrc, setImgSrc] = useState(
    () => getWebAssetUrl(resolvePropertyImageId(mainImageId, imagesIds)),
  )

  return (
    <div
      onClick={() => onView(property)}
      className={cn(
        'group flex cursor-pointer items-center gap-4 rounded-2xl bg-card p-3',
        'border border-border/50 shadow-design-sm',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-px hover:border-border/80 hover:shadow-design-md',
      )}
    >
      {/* Thumbnail — explicit h/w so fill has a defined height without CSS dependency */}
      <div className="relative h-18 w-27.5 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={imgSrc}
          alt={displayName || 'Property'}
          fill
          unoptimized
          className="object-cover transition-transform duration-200 will-change-transform group-hover:scale-[1.05]"
          sizes="110px"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        {type && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="rounded border border-white/10 bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              {type}
            </span>
          </div>
        )}
      </div>

      {/* Property info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[13px] font-semibold text-foreground">{displayName}</p>
        {displayLocation && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-2.5 shrink-0 text-brand-crimson/50" />
            <span className="truncate">{displayLocation}</span>
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-2.5 text-[11px]">
          {square !== undefined && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Maximize2 className="size-3 opacity-50" />
              <span className="font-medium text-foreground/75">{square.toLocaleString()} m²</span>
            </span>
          )}
          {bedroomCount !== undefined && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <BedDouble className="size-3 opacity-50" />
              <span className="font-semibold text-foreground/80">{bedroomCount}</span>
            </span>
          )}
          {bathroomCount !== undefined && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Bath className="size-3 opacity-50" />
              <span className="font-semibold text-foreground/80">{bathroomCount}</span>
            </span>
          )}
        </div>
      </div>

      {/* Price + status */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {price !== undefined ? (
          <span className="whitespace-nowrap text-[14px] font-bold tabular-nums tracking-tight text-foreground">
            {fmtPrice(price)}
          </span>
        ) : (
          <span className="text-[12px] italic text-muted-foreground/55">POA</span>
        )}
        <PropertyStatusBadge status={status} />
      </div>

      {/* Actions */}
      <div onClick={e => e.stopPropagation()}>
        <CardMenu property={property} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
})
