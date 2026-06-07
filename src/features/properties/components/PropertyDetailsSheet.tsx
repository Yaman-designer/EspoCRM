'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import {
  MapPin, Maximize2, BedDouble, Bath,
  Calendar, Pencil, Trash2, X, UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RealEstateProperty } from '../types/property.types'

const FALLBACK = '/images/image.webp'

const toImageUrl = (imageId?: string | null) =>
  imageId ? `/api/espo/Attachment/file/${imageId}` : FALLBACK

const fmt = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: price >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: price >= 1_000_000 ? 2 : 0,
  }).format(price)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })


interface PropertyDetailsSheetProps {
  property: RealEstateProperty | null
  onClose: () => void
  onEdit: (property: RealEstateProperty) => void
  onDelete: (property: RealEstateProperty) => void
}

export const PropertyDetailsSheet = memo(function PropertyDetailsSheet({
  property,
  onClose,
  onEdit,
  onDelete,
}: PropertyDetailsSheetProps) {
  // Tracks whether the current hero image failed to load.
  // Reset via derived-state pattern (setState during render) when the property changes.
  const [prevPropertyId, setPrevPropertyId] = useState(property?.id)
  const [imgFailed, setImgFailed] = useState(false)
  if (prevPropertyId !== property?.id) {
    setPrevPropertyId(property?.id)
    setImgFailed(false)
  }

  if (!property) return null

  const {
    name, title, price, type, status,
    square, bedroomCount, bathroomCount,
    locationName, addressCity,
    propertyCode,
    description, assignedUserName, createdAt,
  } = property

  const displayName     = title || name
  const displayLocation = locationName || addressCity

  const heroSrc = toImageUrl(property.mainImageId)
  const displaySrc = imgFailed ? FALLBACK : heroSrc

  return (
    <Sheet open={!!property} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-150"
      >
        {/* Visually-hidden title satisfies Radix Dialog accessibility requirement */}
        <SheetTitle className="sr-only">{displayName || 'Property Details'}</SheetTitle>

        {/* ── Hero image ──────────────────────────────────── */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
          <Image
            key={heroSrc}
            src={displaySrc}
            alt={displayName || 'Property'}
            fill
            className="object-cover"
            sizes="600px"
            priority
            onError={() => setImgFailed(true)}
          />

          {/* Gradient: dark at top and bottom for overlay readability */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/40" />

          {/* Close */}
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3 z-10 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </SheetClose>

          {/* Status overlay — bottom left */}
          <div className="absolute bottom-3 left-3 z-10">
            <PropertyStatusBadge status={status} variant="overlay" />
          </div>

          {/* Type — bottom right */}
          {type && (
            <span className="absolute bottom-3 right-3 z-10 inline-flex items-center rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              {type}
            </span>
          )}
        </div>

        {/* ── Identity strip ───────────────────────────────── */}
        <div className="shrink-0 px-5 pb-3 pt-4">
          {price !== undefined && (
            <p className="text-[26px] font-bold leading-none tracking-tight text-foreground">
              {fmt(price)}
            </p>
          )}
          <h2
            className={cn(
              'font-semibold text-foreground',
              price !== undefined ? 'mt-1.5 text-[18px]' : 'text-[22px]',
            )}
          >
            {displayName}
          </h2>
          {propertyCode && (
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground/60">
              {propertyCode}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            {displayLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 shrink-0 opacity-60" />
                {displayLocation}
              </span>
            )}
            {square !== undefined && (
              <span className="flex items-center gap-1">
                <Maximize2 className="size-3 shrink-0 opacity-60" />
                {square.toLocaleString()} m²
              </span>
            )}
            {createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3 shrink-0 opacity-60" />
                Listed {fmtDate(createdAt)}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Detail body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5">

            {/* Description */}
            {description && (
              <section>
                <SectionLabel>About</SectionLabel>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </section>
            )}

            {/* Specs */}
            {(bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined) && (
              <section>
                <SectionLabel>Specifications</SectionLabel>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {bedroomCount !== undefined && (
                    <SpecItem icon={BedDouble} label="Bedrooms" value={String(bedroomCount)} />
                  )}
                  {bathroomCount !== undefined && (
                    <SpecItem icon={Bath} label="Bathrooms" value={String(bathroomCount)} />
                  )}
                  {square !== undefined && (
                    <SpecItem icon={Maximize2} label="Area" value={`${square.toLocaleString()} m²`} />
                  )}
                </div>
              </section>
            )}

            {/* Assigned agent */}
            {assignedUserName && (
              <section>
                <SectionLabel>Assigned Agent</SectionLabel>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/40 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    <UserRound className="size-4" />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">
                    {assignedUserName}
                  </span>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Footer actions ───────────────────────────────── */}
        <div className="shrink-0 border-t border-border/40 bg-card px-5 py-3.5">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { onClose(); onEdit(property) }}
            >
              <Pencil className="size-3.5" />
              Edit Property
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-destructive/25 text-destructive hover:bg-destructive/8 hover:border-destructive/40"
              onClick={() => { onClose(); onDelete(property) }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  )
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-muted/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Icon className="size-3 shrink-0" />
        {label}
      </div>
      <span className="text-[13px] font-semibold text-foreground">{value}</span>
    </div>
  )
}
