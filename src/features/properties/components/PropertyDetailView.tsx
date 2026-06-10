'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize2,
  Pencil, Trash2, Heart, Calendar, FileText, User, Clock,
  Star, BadgeCheck, Gem, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import { PropertyGallery } from './PropertyGallery'
import axiosClient from '@/api/axiosClient'
import { cn } from '@/lib/utils'
import type { RealEstateProperty } from '../types/property.types'

const fmtPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : undefined

// ── Listing quality indicator chip — mirrors PropertyCard.IndicatorPill ───────

function IndicatorChip({
  icon: Icon,
  label,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  colorClass: string
}) {
  return (
    <span className={cn(
      'inline-flex h-5 items-center gap-1 rounded-md border px-2',
      'text-[10px] font-semibold leading-none whitespace-nowrap',
      colorClass,
    )}>
      <Icon className="size-3 shrink-0" />
      {label}
    </span>
  )
}

// ── Persistent favorite toggle (EspoCRM follow API) ────────────────────────────

function FavoriteButton({ property }: { property: RealEstateProperty }) {
  const [favorited, setFavorited] = useState(!!property.isFollowed)
  const [loading, setLoading]     = useState(false)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const next = !favorited
    setFavorited(next)
    try {
      if (next) {
        await axiosClient.post(`/RealEstateProperty/${property.id}/follow`)
        toast.success('Added to favorites')
      } else {
        await axiosClient.delete(`/RealEstateProperty/${property.id}/follow`)
        toast.success('Removed from favorites')
      }
    } catch {
      setFavorited(!next)
      toast.error('Failed to update favorites')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={toggle}
      className={cn(
        'gap-1.5 transition-colors',
        favorited && 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100',
      )}
    >
      <Heart className={cn('size-3.5', favorited && 'fill-current')} />
      {favorited ? 'Saved' : 'Save'}
    </Button>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title:    string
  icon?:    React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="mt-8 border-t border-border/30 pt-8">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground/50" />}
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Placeholder for features not yet wired to EspoCRM API ─────────────────────

function Placeholder({
  Icon,
  text,
}: {
  Icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 px-6 py-10 text-center">
      <Icon className="size-8 text-muted-foreground/20" />
      <p className="max-w-sm text-[12.5px] leading-relaxed text-muted-foreground/50">{text}</p>
    </div>
  )
}

// ── PropertyDetailView ─────────────────────────────────────────────────────────

interface PropertyDetailViewProps {
  property: RealEstateProperty
  onEdit:   (p: RealEstateProperty) => void
  onDelete: (p: RealEstateProperty) => void
}

export function PropertyDetailView({ property, onEdit, onDelete }: PropertyDetailViewProps) {
  const router = useRouter()

  const {
    title, name, price, status, type,
    propertyCode, locationName, addressCity,
    description, square, bedroomCount, bathroomCount,
    assignedUserName, createdAt, modifiedAt,
    mainImageId, imagesIds,
    isFeatured, isVerified, isPremium, isNewListing,
  } = property

  const displayName     = title || name
  const displayLocation = [locationName, addressCity].filter(Boolean).join(', ')
  const hasSpecs        = bedroomCount !== undefined || bathroomCount !== undefined || square !== undefined
  const hasIndicators   = !!(isFeatured || isVerified || isPremium || isNewListing)

  const detailRows = [
    { label: 'Reference',      value: propertyCode ? `Ref #${propertyCode}` : undefined },
    { label: 'Property Type',  value: type },
    { label: 'Status',         value: status },
    { label: 'Total Area',     value: square ? `${square.toLocaleString()} m²` : undefined },
    { label: 'Bedrooms',       value: bedroomCount?.toString() },
    { label: 'Bathrooms',      value: bathroomCount?.toString() },
    { label: 'City',           value: addressCity },
    { label: 'District',       value: locationName },
    { label: 'Assigned Agent', value: assignedUserName },
    { label: 'Date Listed',    value: fmtDate(createdAt) },
    { label: 'Last Updated',   value: fmtDate(modifiedAt) },
  ].filter((row): row is { label: string; value: string } => !!row.value)

  return (
    <div className="min-h-0">

      {/* ── Back navigation ───────────────────────────────────────────── */}
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Properties
        </button>
      </div>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div className="px-4 pb-16 pt-5 sm:px-6">

        {/* ── Hero: Gallery + Sidebar ─────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">

          {/* Gallery */}
          <PropertyGallery
            mainImageId={mainImageId}
            imageIds={imagesIds}
            title={displayName}
          />

          {/* Sidebar info */}
          <div className="flex flex-col gap-4">

            {/* Status + Ref */}
            <div className="flex flex-wrap items-center gap-2">
              <PropertyStatusBadge status={status} />
              {propertyCode && (
                <span className="text-[11.5px] tabular-nums text-muted-foreground/45">
                  Ref #{propertyCode}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-[26px] font-black leading-tight tracking-tight text-foreground sm:text-[28px]">
                {displayName || '—'}
              </h1>
              {type && (
                <p className="mt-1 text-[13px] text-muted-foreground">{type}</p>
              )}
            </div>

            {/* Listing quality indicators */}
            {hasIndicators && (
              <div className="flex flex-wrap items-center gap-1.5">
                {isFeatured  && <IndicatorChip icon={Star}       label="Featured" colorClass="border-amber-200/70 bg-amber-50 text-amber-600" />}
                {isVerified  && <IndicatorChip icon={BadgeCheck} label="Verified" colorClass="border-emerald-200/70 bg-emerald-50 text-emerald-600" />}
                {isPremium   && <IndicatorChip icon={Gem}        label="Premium"  colorClass="border-violet-200/70 bg-violet-50 text-violet-600" />}
                {isNewListing && <IndicatorChip icon={Sparkles}  label="New"      colorClass="border-primary/15 bg-primary/8 text-primary" />}
              </div>
            )}

            {/* Price */}
            {price !== undefined ? (
              <p className="text-[32px] font-black leading-none tabular-nums tracking-tight text-primary">
                {fmtPrice(price)}
              </p>
            ) : (
              <p className="text-[13px] italic text-muted-foreground">Price on request</p>
            )}

            {/* Location */}
            {displayLocation && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[13px] text-muted-foreground">{displayLocation}</span>
              </div>
            )}

            {hasSpecs && <div className="h-px bg-border/40" />}

            {/* Specs tiles */}
            {hasSpecs && (
              <div className="grid grid-cols-3 gap-2">
                {bedroomCount !== undefined && (
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 py-3">
                    <BedDouble className="size-4 text-muted-foreground/50" />
                    <span className="text-[18px] font-black tabular-nums">{bedroomCount}</span>
                    <span className="text-[9.5px] font-medium text-muted-foreground">Beds</span>
                  </div>
                )}
                {bathroomCount !== undefined && (
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 py-3">
                    <Bath className="size-4 text-muted-foreground/50" />
                    <span className="text-[18px] font-black tabular-nums">{bathroomCount}</span>
                    <span className="text-[9.5px] font-medium text-muted-foreground">Baths</span>
                  </div>
                )}
                {square !== undefined && (
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 py-3">
                    <Maximize2 className="size-4 text-muted-foreground/50" />
                    <span className="text-[18px] font-black tabular-nums">
                      {square >= 1000 ? `${(square / 1000).toFixed(1)}k` : square}
                    </span>
                    <span className="text-[9.5px] font-medium text-muted-foreground">m²</span>
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-border/40" />

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(property)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <FavoriteButton property={property} />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(property)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>

            {/* Assigned Agent card */}
            {assignedUserName && (
              <>
                <div className="h-px bg-border/40" />
                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
                      Assigned Agent
                    </p>
                    <p className="text-[13px] font-semibold text-foreground">{assignedUserName}</p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* ── Description ─────────────────────────────────────────────── */}
        {description && (
          <Section title="Description" icon={FileText}>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </Section>
        )}

        {/* ── Property Details ────────────────────────────────────────── */}
        {detailRows.length > 0 && (
          <Section title="Property Details">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {detailRows.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-muted/30 p-3">
                  <p className="text-[9.5px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Activity Timeline ────────────────────────────────────────── */}
        <Section title="Activity Timeline" icon={Clock}>
          <Placeholder
            Icon={Clock}
            text="Property history, status changes, agent notes, and client interactions will appear here."
          />
        </Section>

        {/* ── Documents ───────────────────────────────────────────────── */}
        <Section title="Documents" icon={FileText}>
          <Placeholder
            Icon={FileText}
            text="Contracts, floor plans, title deeds, and other property documents will appear here."
          />
        </Section>

        {/* ── Property History ────────────────────────────────────────── */}
        <Section title="Property History" icon={Calendar}>
          <Placeholder
            Icon={Calendar}
            text="Price history, previous listings, and ownership records will appear here."
          />
        </Section>

      </div>
    </div>
  )
}
