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
import { PropertyStatusBadge } from './PropertyStatusBadge'
import type { RealEstateProperty } from '../types/property.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const FALLBACK = '/images/image.webp'

const toImageUrl = (imageId?: string | null) =>
  imageId ? `/api/espo/Attachment/file/${imageId}` : FALLBACK

const fmtPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

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
          <MoreHorizontal className="size-3.75" />
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

// ── PropertyCard (grid) ───────────────────────────────────────────────────────

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
    locationName, addressCity,
    mainImageId,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity

  const [imgSrc, setImgSrc] = useState(toImageUrl(mainImageId))
  const priceCtx = PRICE_CONTEXT[status]

  const hasSpecs = bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined

  return (
    <article
      className={cn(
        'group flex h-full cursor-pointer flex-col gap-3 rounded-3xl bg-card p-3',
        'border border-border/50 shadow-design-sm',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:border-border/80 hover:shadow-design-lg',
      )}
      onClick={() => onView(property)}
    >
      {/* ── Image ─────────────────────────────────────────── */}
      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={imgSrc}
          alt={displayName || 'Property'}
          fill
          className="object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK)}
        />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/5 to-transparent" />

        <div className="absolute left-2.5 top-2.5 z-10">
          <PropertyStatusBadge status={status} variant="overlay" />
        </div>

        <div className="absolute right-2.5 top-2.5 z-10" onClick={e => e.stopPropagation()}>
          <CardMenu
            property={property}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            triggerClass="bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
          />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">

        {/* Title + type chip */}
        <div className="mb-1.5 flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-[15px] font-semibold leading-snug text-foreground">
            {displayName || property.id}
          </h3>
          {type && (
            <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              {type}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
          {price !== undefined ? (
            <span className="text-[22px] font-bold leading-none tracking-tight text-foreground">
              {fmtPrice(price)}
            </span>
          ) : (
            <span className="text-[13px] font-medium italic text-muted-foreground/55">
              Price on request
            </span>
          )}
          {priceCtx && (
            <span className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5',
              'text-[10px] font-semibold uppercase tracking-wide',
              priceCtx.cls,
            )}>
              {priceCtx.label}
            </span>
          )}
        </div>

        {/* Location */}
        {displayLocation ? (
          <p className="flex items-center gap-1 truncate text-[12px] text-muted-foreground">
            <MapPin className="size-3 shrink-0 text-brand-crimson/55" />
            <span className="truncate">{displayLocation}</span>
          </p>
        ) : (
          <div aria-hidden className="h-4" />
        )}

        {/* Specs */}
        {hasSpecs && (
          <>
            <div className="my-3 h-px bg-border/50" />
            <div className="flex items-center gap-3.5">
              {bedroomCount !== undefined && (
                <span className="flex items-center gap-1 text-[12.5px]">
                  <BedDouble className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/85">{bedroomCount}</span>
                </span>
              )}
              {bathroomCount !== undefined && (
                <span className="flex items-center gap-1 text-[12.5px]">
                  <Bath className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/85">{bathroomCount}</span>
                </span>
              )}
              {square !== undefined && (
                <span className="flex items-center gap-1 text-[12.5px]">
                  <Maximize2 className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-semibold tabular-nums text-foreground/85">
                    {square.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground/50">m²</span>
                </span>
              )}
            </div>
          </>
        )}

      </div>
    </article>
  )
})


// ── PropertyListRow (list-view variant) ──────────────────────────────────────

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
    mainImageId,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity

  const [imgSrc, setImgSrc] = useState(toImageUrl(mainImageId))

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
      {/* Thumbnail */}
      <div className="relative h-18 w-27.5 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={imgSrc}
          alt={displayName || 'Property'}
          fill
          className="object-cover transition-transform duration-200 will-change-transform group-hover:scale-[1.05]"
          sizes="110px"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK)}
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
          <span className="text-[14px] font-bold tabular-nums tracking-tight text-foreground">
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
