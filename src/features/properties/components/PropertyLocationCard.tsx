'use client'

import { useState } from 'react'
import {
  MapPin, Globe, Layers, Navigation,
  Copy, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PropertyMap } from './PropertyMap'
import { NearbyPlaces } from './NearbyPlaces'
import { usePropertyLocation, buildGeoQuery } from '../hooks/usePropertyLocation'
import { getDisplayName } from '../lib/display'
import type { RealEstateProperty } from '../types/property.types'

// ── Design token ──────────────────────────────────────────────────────────────

const CARD = cn(
  'rounded-[24px] bg-card',
  'border border-border/18',
  'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06)]',
)

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon:   React.ComponentType<{ className?: string }>
  label:  string
  value:  string
  mono?:  boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/8 py-3 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-muted-foreground/35" />
        <span className="text-[12px] font-medium text-muted-foreground/52">{label}</span>
      </div>
      <span className={cn(
        'text-right text-[13px] font-semibold text-foreground',
        mono && 'font-mono text-[11.5px] text-muted-foreground/70',
      )}>
        {value}
      </span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LocationSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* Map skeleton */}
        <div className="relative h-105 overflow-hidden rounded-[24px] border border-border/18 bg-linear-to-br from-[#EAF4FF] via-[#EEF5FF] to-[#E5EEFF]">
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,97,188,0.28) 1px, transparent 1px)',
              backgroundSize:  '22px 22px',
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="size-14 animate-pulse rounded-full bg-primary/25 ring-8 ring-primary/8" />
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/60 shadow-sm" />
          </div>
        </div>
        {/* Info panel skeleton */}
        <div className="space-y-3 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-border/8 py-3">
              <div className="flex items-center gap-2">
                <div className="size-3.5 animate-pulse rounded bg-muted/45" />
                <div className="h-3 w-14 animate-pulse rounded-full bg-muted/40" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded-full bg-muted/40" />
            </div>
          ))}
          <div className="mt-2 h-10 w-full animate-pulse rounded-2xl bg-muted/35" />
        </div>
      </div>
      {/* Nearby places skeleton — simplified */}
      <div className="h-3 w-24 animate-pulse rounded-full bg-muted/40" />
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-3">
                <div className="size-9 shrink-0 animate-pulse rounded-[12px] bg-muted/40" />
                <div className="h-3 flex-1 animate-pulse rounded-full bg-muted/35" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state (no geocoded coordinates) ─────────────────────────────────────

function LocationEmptyState({ property }: { property: RealEstateProperty }) {
  const { locationName, subRegionLocationName, regionLocationName, addressCity } = property

  const district = locationName
  const area     = subRegionLocationName
  const region   = regionLocationName
  const city     = addressCity

  return (
    <div className="space-y-5">
      {/* Atmospheric map placeholder */}
      <div className="relative h-52 overflow-hidden rounded-[20px] border border-border/10 bg-linear-to-br from-[#EBF4FF] via-[#EEF6FF] to-[#E6EEFF]">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,97,188,0.35) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-32 rounded-full border border-primary/10" />
            <div className="absolute size-20 rounded-full border border-primary/15" />
            <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-[0_4px_20px_rgba(0,97,188,0.18)]">
              <MapPin className="size-5 text-primary/65" />
            </div>
          </div>
        </div>
      </div>

      {/* Location context — structured and curated */}
      {(district || area || region || city) ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(district || city) && (
            <div className="rounded-lg border border-border/12 bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/35">District</p>
              <p className="text-[13.5px] font-semibold text-foreground">{district || city}</p>
            </div>
          )}
          {area && (
            <div className="rounded-lg border border-border/12 bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/35">Area</p>
              <p className="text-[13.5px] font-semibold text-foreground">{area}</p>
            </div>
          )}
          {region && (
            <div className="rounded-lg border border-border/12 bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/35">Region</p>
              <p className="text-[13.5px] font-semibold text-foreground">{region}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/22 bg-muted/8 px-4 py-4">
          <MapPin className="size-4 shrink-0 text-muted-foreground/28" />
          <p className="text-[13px] text-muted-foreground/45">Location details available on request</p>
        </div>
      )}
    </div>
  )
}

// ── Location info panel ───────────────────────────────────────────────────────

function LocationInfoPanel({
  property,
  latitude,
  longitude,
  formattedAddress,
}: {
  property:         RealEstateProperty
  latitude:         number
  longitude:        number
  formattedAddress: string
}) {
  const [copied, setCopied] = useState(false)

  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`
  const coordStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

  async function copyCoords() {
    await navigator.clipboard?.writeText(coordStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { locationName, subRegionLocationName, regionLocationName } = property

  return (
    <div className="flex flex-col justify-between gap-6 pt-1">
      <div className="divide-y divide-border/8">
        {locationName          && <InfoRow icon={MapPin}    label="Area"        value={locationName} />}
        {subRegionLocationName && <InfoRow icon={Globe}     label="District"    value={subRegionLocationName} />}
        {regionLocationName    && <InfoRow icon={Layers}    label="Region"      value={regionLocationName} />}
        {property.addressCity  && <InfoRow icon={MapPin}    label="City"        value={property.addressCity} />}
        <InfoRow icon={Globe}      label="Country"     value="Greece" />
        <InfoRow icon={Navigation} label="Coordinates" value={coordStr} mono />
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary transition-colors hover:text-primary/70 focus-visible:outline-none"
        >
          <ExternalLink className="size-3.5" />
          Open in Google Maps
        </a>
        <button
          type="button"
          onClick={copyCoords}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/45 transition-colors hover:text-foreground focus-visible:outline-none"
        >
          <Copy className="size-3" />
          {copied ? 'Copied!' : 'Copy Coordinates'}
        </button>
      </div>
    </div>
  )
}

// ── PropertyLocationCard ──────────────────────────────────────────────────────

interface PropertyLocationCardProps {
  property:   RealEstateProperty
  className?: string
}

export function PropertyLocationCard({ property, className }: PropertyLocationCardProps) {
  const {
    locationName, subRegionLocationName, regionLocationName,
    propertyCode,
  } = property

  const hasAnyLocationField = !!(locationName || subRegionLocationName || regionLocationName)

  const { data: geo, isLoading, isError } = usePropertyLocation({
    locationName,
    subRegionLocationName,
    regionLocationName,
  })

  // If there are no location fields at all, don't render the section
  if (!hasAnyLocationField && !isLoading) return null

  const geoQuery = buildGeoQuery({ locationName, subRegionLocationName, regionLocationName })
  const title    = getDisplayName(property)

  return (
    <div className={cn(className)}>

      {/* Section header */}
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-muted-foreground/42">
          Location Intelligence
        </p>
        {geoQuery && (
          <p className="mt-2 text-[11px] text-muted-foreground/35">
            {geoQuery}
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LocationSkeleton />
      ) : geo ? (
        <div className="space-y-8">

          {/* Map + info panel */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            <PropertyMap
              latitude={geo.latitude}
              longitude={geo.longitude}
              title={title}
              propertyCode={propertyCode}
              areaName={locationName}
              height={460}
            />
            <LocationInfoPanel
              property={property}
              latitude={geo.latitude}
              longitude={geo.longitude}
              formattedAddress={geo.formattedAddress}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border/8" />

          {/* Nearby places */}
          <NearbyPlaces latitude={geo.latitude} longitude={geo.longitude} />

        </div>
      ) : (
        <LocationEmptyState property={property} />
      )}

    </div>
  )
}
