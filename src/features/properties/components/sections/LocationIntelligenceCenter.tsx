'use client'

import { useMemo, useState } from 'react'
import {
  Building, X, ExternalLink,
  GraduationCap, Stethoscope, TrainFront, UtensilsCrossed, ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { usePropertyLocation, useNearbyPlaces } from '../../hooks/usePropertyLocation'
import { handleRovingTabListKeyDown } from '../../lib/keyboard-nav'
import type { NearbyPlace, PlaceCategory } from '../../hooks/usePropertyLocation'
import type { RealEstateProperty } from '../../types/property.types'
import { formatDistance, buildGoogleMapsUrl } from '../../services/geocoding.service'
import { MapLibreMap } from '../PropertyMapLibre'

// ── Types ──────────────────────────────────────────────────────────────────────

type LocationTab = 'education' | 'medical' | 'transit' | 'walk'

// Enterprise Geospatial pass (2026-07-19). Real Overpass categories only —
// see geocoding.service.ts's resolveCategory(). "Walk" maps to the two
// lifestyle-adjacent categories that actually exist (dining, shopping);
// there is no walkability score or parks data anywhere in this stack, so
// the tab surfaces real nearby places rather than a fabricated metric.
const TAB_CONFIG: Record<LocationTab, { label: string; categories: PlaceCategory[]; icon: LucideIcon; radiusLabel: string }> = {
  education: { label: 'Education', categories: ['school'],               icon: GraduationCap,  radiusLabel: 'Schools within 2km' },
  medical:   { label: 'Medical',   categories: ['hospital'],             icon: Stethoscope,    radiusLabel: 'Medical within 2km' },
  transit:   { label: 'Transit',   categories: ['metro'],                icon: TrainFront,     radiusLabel: 'Transit within 2km' },
  walk:      { label: 'Walk',      categories: ['restaurant', 'shopping'], icon: UtensilsCrossed, radiusLabel: 'Dining & shops within 2km' },
}

// Matches fetchNearbyPlaces()'s own default radiusM in geocoding.service.ts
// — the real area the Overpass query covers, drawn on the map as-is rather
// than a separately-invented per-category radius.
const SEARCH_RADIUS_M = 2000

const CATEGORY_META: Record<PlaceCategory, { label: string; icon: LucideIcon }> = {
  school:     { label: 'Schools',  icon: GraduationCap },
  hospital:   { label: 'Medical',  icon: Stethoscope },
  metro:      { label: 'Transit',  icon: TrainFront },
  restaurant: { label: 'Dining',   icon: UtensilsCrossed },
  shopping:   { label: 'Shopping', icon: ShoppingBag },
}
const ALL_CATEGORIES: PlaceCategory[] = ['school', 'hospital', 'metro', 'restaurant', 'shopping']

// ── AmenityStat — shared KPI tile for both the bottom strip and the panel ──

function AmenityStat({
  icon: Icon, label, count, nearest, active, compact,
}: {
  icon:     LucideIcon
  label:    string
  count:    number
  nearest?: NearbyPlace
  active?:  boolean
  compact?: boolean
}) {
  const hasData = count > 0
  return (
    <div
      className={cn(
        'flex items-center gap-3 min-w-0 rounded-xl border px-4 py-3 transition-all duration-200 ease-out',
        active ? 'border-primary/30 bg-primary/5' : 'border-border/35 bg-muted/3',
        compact && 'py-2.5',
      )}
    >
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary/10' : 'bg-muted/50')}>
        <Icon className={cn('size-4', active ? 'text-primary/75' : 'text-muted-foreground/50')} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={cn('text-[14px] font-black tracking-tight truncate', hasData ? 'text-foreground' : 'text-muted-foreground/35')}>
          {hasData ? count : 'None found'}
        </p>
        {hasData && nearest && (
          <p className="text-[10px] font-medium text-muted-foreground/45 truncate">nearest {formatDistance(nearest.distance)}</p>
        )}
      </div>
    </div>
  )
}

// ── Bottom stats strip (overlaid on map) ──────────────────────────────────────
// Enterprise Geospatial pass: rebuilt on the same real Overpass data, now
// covering all 5 fetched categories (Shopping was already fetched and
// simply never surfaced anywhere) with a premium empty state instead of a
// bare "—", and a highlight on whichever category the active filter tab
// is currently showing on the map — the strip now visibly reacts to the
// filter instead of sitting inert beside it.

function StatValue({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) {
    return <div className="h-6 w-8 mx-auto animate-pulse rounded-md bg-muted-foreground/15" />
  }
  return <>{children}</>
}

function BottomStatsStrip({
  counts, computable, loading, activeCategories,
}: {
  counts:            Record<PlaceCategory, number>
  computable:        boolean
  loading:           boolean
  activeCategories:  PlaceCategory[]
}) {
  const unavailableTitle = computable ? undefined : 'Requires property coordinates'

  return (
    <div className="absolute bottom-6 left-6 right-6 lg:right-auto z-10">
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/60 flex items-center justify-between lg:justify-start gap-6 lg:gap-8 overflow-x-auto no-scrollbar">
        {ALL_CATEGORIES.map((cat, i) => {
          const meta   = CATEGORY_META[cat]
          const count  = counts[cat]
          const active = activeCategories.includes(cat)
          return (
            <div key={cat} className="flex items-center gap-6 lg:gap-8 shrink-0">
              {i > 0 && <div className="w-px h-8 bg-border shrink-0" />}
              <div
                className="text-center shrink-0"
                title={!loading && count === 0 ? unavailableTitle : undefined}
              >
                <div className={cn('text-2xl font-black font-heading tracking-tighter transition-colors', active ? 'text-primary' : 'text-foreground')}>
                  <StatValue loading={loading}>{count > 0 ? count : '—'}</StatValue>
                </div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {meta.label} Nearby
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Map simulator (shown when real geo is unavailable) ────────────────────────

const SIM_PIN_POSITIONS = [
  { top: '18%', left: '14%' },
  { top: '66%', left: '12%' },
  { top: '16%', left: '62%' },
]

function MapSimulator({
  propertyLabel,
  regionHint,
  locationText,
  nearby,
  activeCategories,
}: {
  propertyLabel: string
  regionHint?:   string
  locationText?: string
  nearby:        NearbyPlace[]
  activeCategories: PlaceCategory[]
}) {
  const tabPlaces = nearby
    .filter(p => activeCategories.includes(p.category))
    .slice(0, 3)

  const searchUrl = buildGoogleMapsUrl({ locationText })

  return (
    <>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          Location Data Unavailable
        </div>
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-black/75"
          >
            <ExternalLink className="size-2.5" />
            Search on Maps
          </a>
        )}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-70 h-70 border border-primary/20 rounded-full flex items-center justify-center">
          <div className="absolute top-0 text-[8px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/10 shadow-sm whitespace-nowrap">
            Nearby
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 border border-primary/10 rounded-full flex items-center justify-center">
          <div className="absolute top-0 text-[8px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/10 shadow-sm whitespace-nowrap">
            Extended Area
          </div>
        </div>
      </div>

      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,150 L1000,250 M300,0 L400,600 M700,0 L600,600 M0,450 L1000,550"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
        />
      </svg>

      {tabPlaces.map((place, i) => (
        <div
          key={place.id}
          style={{ top: SIM_PIN_POSITIONS[i]?.top, left: SIM_PIN_POSITIONS[i]?.left }}
          className="absolute transition-transform duration-500 hover:scale-105"
        >
          <div className="relative flex flex-col items-center gap-1">
            <div className="bg-white shadow-md px-3 py-1.5 rounded-full border border-border flex items-center gap-2 cursor-pointer hover:shadow-lg">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-tight whitespace-nowrap max-w-28 truncate">
                {place.name}
              </span>
            </div>
            <div className="bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {formatDistance(place.distance)}
            </div>
          </div>
        </div>
      ))}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="relative">
          <div className="absolute -inset-6 bg-primary/10 rounded-full animate-ping" />
          <div className="bg-primary text-white w-14 h-14 rounded-[20px] shadow-lg flex items-center justify-center border-4 border-white relative z-10 hover:scale-105 transition-transform cursor-pointer">
            <Building className="w-6 h-6" />
            <div className="absolute -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary" />
          </div>
        </div>
        <div className="mt-4 bg-foreground text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg border border-white/10 uppercase tracking-widest whitespace-nowrap">
          {propertyLabel}{regionHint ? ` · ${regionHint}` : ''}
        </div>
      </div>
    </>
  )
}

// ── Geocoding pending state ────────────────────────────────────────────────

function GeocodingPendingState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br from-[#EAF4FF] via-[#EEF5FF] to-[#E5EEFF]">
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,97,188,0.30) 1px, transparent 1px)',
          backgroundSize:  '22px 22px',
        }}
      />
      <div className="relative flex size-14 animate-pulse items-center justify-center rounded-full bg-primary/25 ring-8 ring-primary/8">
        <Building className="size-5 text-primary/70" />
      </div>
      <p className="relative text-[10px] font-black uppercase tracking-widest text-primary/60">
        Locating property…
      </p>
    </div>
  )
}

// ── Neighborhood panel (right column) ──────────────────────────────────────────
// Enterprise Geospatial pass (2026-07-19). Previously two rows (nearest
// transit, nearest dining) inside a fixed-height card with `justify-between`
// stretching them apart from a description block above — most of the
// card's height was empty padding. Rebuilt into two real sections: an
// "Active Filter" detail that changes with the selected tab (the panel
// genuinely reacts to the filter now, not just the map) and a persistent
// 5-category amenities grid using the exact same KPI tile language
// established on the Hero and Financial sections. Every number here is a
// real count from the Overpass results already fetched — no location
// score, safety index, or investment outlook is shown, because no such
// data exists anywhere in this stack; inventing one would be exactly the
// "fake statistics" this task explicitly forbids.

function NeighborhoodPanel({
  locationDisplay,
  propertyType,
  propertyStatus,
  propertyRequestType,
  nearby,
  counts,
  computable,
  loading,
  activeTab,
}: {
  locationDisplay:      string
  propertyType?:        string
  propertyStatus?:      string
  propertyRequestType?: string
  nearby:               NearbyPlace[]
  counts:               Record<PlaceCategory, number>
  computable:            boolean
  loading:               boolean
  activeTab:             LocationTab
}) {
  const config = TAB_CONFIG[activeTab]
  const activePlaces = nearby
    .filter(p => config.categories.includes(p.category))
    .slice(0, 3)

  return (
    <div className="col-span-12 lg:col-span-4 bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 flex flex-col gap-6">

      {/* Neighborhood summary */}
      <div>
        <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
          Neighborhood Summary
        </h4>
        <div className="p-4 bg-muted/3 rounded-xl border border-border/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/60 rounded-full" />
          <p className="text-[13px] text-foreground/80 font-medium leading-relaxed">
            {locationDisplay} —{' '}
            <span className="text-foreground font-bold">
              {propertyType?.toLowerCase() ?? 'property'}
              {propertyRequestType ? ` for ${propertyRequestType.toLowerCase()}` : ''}
            </span>
            {propertyStatus ? (
              <>
                {', currently '}
                <span className="font-bold text-primary/80">{propertyStatus.toLowerCase()}</span>
              </>
            ) : null}
            {'.'}
          </p>
        </div>
      </div>

      {/* Active filter detail — genuinely changes with the selected tab */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <config.icon className="size-3.5 text-primary/70" />
          <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
            {config.label} · {config.radiusLabel}
          </h4>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <div key={i} className="h-11 rounded-xl bg-muted/20 animate-pulse" />)}
          </div>
        ) : activePlaces.length > 0 ? (
          <div className="space-y-2">
            {activePlaces.map(place => (
              <div key={place.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-border/40 hover:bg-muted/8 transition-colors">
                <span className="text-[12.5px] font-bold text-foreground truncate">{place.name}</span>
                <span className="text-[10px] font-black text-muted-foreground/55 uppercase shrink-0 tabular-nums">
                  {formatDistance(place.distance)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-5 text-center rounded-xl border border-dashed border-border/30">
            <config.icon className="size-4 text-muted-foreground/30" />
            <p className="text-[11px] font-semibold text-muted-foreground/45 px-4">
              {computable
                ? `No ${config.label.toLowerCase()} found within 2km`
                : 'Requires property coordinates'}
            </p>
          </div>
        )}
      </div>

      {/* Amenities overview — persistent, all 5 real categories, fills the
          remainder of the panel with real content instead of empty
          stretch. The active tab's tile is highlighted, visibly tying the
          panel back to what's plotted on the map. */}
      <div className="flex-1">
        <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
          Amenities Overview
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {ALL_CATEGORIES.map(cat => {
            const meta    = CATEGORY_META[cat]
            const nearest = nearby.filter(p => p.category === cat)[0]
            return (
              <AmenityStat
                key={cat}
                icon={meta.icon}
                label={meta.label}
                count={counts[cat]}
                nearest={nearest}
                active={config.categories.includes(cat)}
                compact
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Address & Coordinates panel ───────────────────────────────────────────────
// Property Details Completion (2026-07-17). Distinct from the map above: the
// map plots geocoded coordinates derived from location NAMES
// (usePropertyLocation), while this panel shows the Wizard's own stored
// addressLatitude/addressLongitude fields directly — the two can differ, and
// this is the only place either the raw address components or the stored
// coordinates are exposed at all. "Open in Google Maps" and "Copy
// Coordinates" both act on the stored fields, not the derived ones.

// IA Sprint 3 (2026-07-18): exported and rendered as its own top-level card
// in PropertyDetailView, split out of the map/neighborhood card below. The
// two serve different reading modes — spatial/exploratory (the map) versus
// factual/scannable (address, coordinates, distances) — and had grown into
// the single tallest scroll segment on the page as one combined card.
export function AddressCoordinatesPanel({ property }: { property: RealEstateProperty }) {
  const {
    addressStreet, addressCity, addressState, addressPostalCode, addressCountry,
    addressLatitude, addressLongitude, addressGeocodeType,
    belt, view, withinCityPlan, closeTo,
    distanceFromSea, distanceFromCity, distanceFromVillage, distanceFromAirport,
  } = property

  const addressParts = [addressStreet, addressCity, addressState, addressPostalCode, addressCountry]
    .filter((part): part is string => !!part?.trim())
  const hasCoords = addressLatitude != null && addressLongitude != null
  const { copied, copy } = useCopyToClipboard()

  function copyCoordinates() {
    if (!hasCoords) return
    void copy(`${addressLatitude}, ${addressLongitude}`)
  }

  const distances: Array<{ label: string; value?: number }> = [
    { label: 'From Sea',     value: distanceFromSea },
    { label: 'From City',    value: distanceFromCity },
    { label: 'From Village', value: distanceFromVillage },
    { label: 'From Airport', value: distanceFromAirport },
  ].filter(d => d.value != null)

  const facts: Array<{ label: string; value?: string | null }> = [
    { label: 'Zoning Belt',      value: belt },
    { label: 'View',             value: view },
    { label: 'Close To',         value: closeTo },
    { label: 'Within City Plan', value: withinCityPlan == null ? undefined : (withinCityPlan ? 'Yes' : 'No') },
  ].filter(f => f.value)

  if (addressParts.length === 0 && !hasCoords && distances.length === 0 && facts.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Address &amp; Coordinates
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
          Exact address, stored coordinates, and distances
        </p>
      </div>

      <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm">

      {/* Data Completeness Sprint 5.1: Address and Coordinates are Required,
          singular, per-property facts — previously each column only
          rendered when populated, so the grid silently went from 3 columns
          to 2 to 1 depending on what a given property happened to have,
          changing this card's shape property-to-property. Both now always
          occupy their slot once the card renders at all, with a neutral
          placeholder when empty — matching this page's established
          Required-field pattern (Command Hub's EntityRow). Distances stays
          conditional: it's a variable-length list of sub-facts, not a
          single value, so an empty "Distances" column with nothing under
          it wouldn't carry the same meaning a placeholder does for a
          single fact. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Address */}
        <div>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Address</p>
          {addressParts.length > 0 ? (
            <p className="text-sm font-semibold text-foreground leading-snug">{addressParts.join(', ')}</p>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground/40">Not provided</p>
          )}
        </div>

        {/* Coordinates */}
        <div>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Coordinates{addressGeocodeType ? ` · ${addressGeocodeType}` : ''}
          </p>
          {hasCoords ? (
            <>
              <p className="text-sm font-semibold text-foreground tabular-nums mb-2">
                {addressLatitude!.toFixed(6)}, {addressLongitude!.toFixed(6)}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps?q=${addressLatitude},${addressLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase tracking-wide text-primary hover:underline"
                >
                  Open in Google Maps
                </a>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={copyCoordinates}
                  className="text-[10px] font-black uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  {copied ? 'Copied' : 'Copy Coordinates'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground/40">Not provided</p>
          )}
        </div>

        {/* Distances */}
        {distances.length > 0 && (
          <div>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Distances</p>
            <div className="space-y-1">
              {distances.map(d => (
                <p key={d.label} className="text-xs font-semibold text-foreground/80">
                  {d.label}: <span className="tabular-nums">{d.value}</span> km
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoning / view facts */}
      {facts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-border/40">
          {facts.map(f => (
            <span key={f.label} className="px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70">
              {f.label}: {f.value}
            </span>
          ))}
        </div>
      )}
      </div>
    </section>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface LocationIntelligenceCenterProps {
  property: RealEstateProperty
}

export function LocationIntelligenceCenter({
  property,
}: LocationIntelligenceCenterProps) {
  const [activeTab, setActiveTab]         = useState<LocationTab>('education')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  const {
    locationName,
    subRegionLocationName,
    regionLocationName,
    addressCity,
    addressLatitude,
    addressLongitude,
    addressStreet,
    addressState,
    addressPostalCode,
    addressCountry,
    addressGeocodeType,
    modifiedAt,
    propertyCode,
    type:        propertyType,
    status:      propertyStatus,
    requestType: propertyRequestType,
  } = property

  const { data: geo, isLoading: geoLoading } = usePropertyLocation({
    locationName,
    subRegionLocationName,
    regionLocationName,
    addressCity,
  })

  // Data Authenticity Certification (Sprint 2). addressLatitude/
  // addressLongitude are the property's own real, manually-entered exact
  // coordinates — a different, more authoritative source than `geo`, which
  // is an approximate match from geocoding a location NAME (Nominatim/
  // Google). Previously the map always used `geo` even when real exact
  // coordinates existed on the record. Now prefers the real value and only
  // falls back to the approximate geocoded one, disclosed as such below.
  const hasRealCoords = addressLatitude != null && addressLongitude != null
  const mapCoords = hasRealCoords
    ? { latitude: addressLatitude, longitude: addressLongitude, isApproximate: false }
    : geo
      ? { latitude: geo.latitude, longitude: geo.longitude, isApproximate: true }
      : null

  // Interactive Map Experience phase. `geoLoading` only means anything while
  // there's no real stored coordinate to short-circuit it — otherwise the
  // map is never actually waiting on this query at all.
  const geoPending = !hasRealCoords && geoLoading

  const { data: nearby = [], isLoading: nearbyLoading } = useNearbyPlaces(
    mapCoords?.latitude  ?? null,
    mapCoords?.longitude ?? null,
  )

  // Memoized — recomputed only when the fetched result set actually
  // changes, not on every render (filter-tab switches, hover, etc. reuse
  // this same object).
  const counts = useMemo(() => {
    const result = {} as Record<PlaceCategory, number>
    for (const cat of ALL_CATEGORIES) result[cat] = nearby.filter(p => p.category === cat).length
    return result
  }, [nearby])

  const activeCategories = TAB_CONFIG[activeTab].categories
  const activeNearby = useMemo(
    () => nearby.filter(p => activeCategories.includes(p.category)),
    [nearby, activeCategories],
  )

  const displayLocation = locationName || subRegionLocationName || addressCity || 'Area Location'
  const propertyLabel   = propertyCode ?? locationName ?? 'Property'
  const locationSearchText = [locationName, subRegionLocationName, regionLocationName, addressCity]
    .filter((v): v is string => !!v?.trim())[0]
  const addressText = [addressStreet, addressCity, addressState, addressPostalCode, addressCountry]
    .filter((part): part is string => !!part?.trim())
    .join(', ') || undefined

  const tabs = (Object.keys(TAB_CONFIG) as LocationTab[]).map(id => ({ id, ...TAB_CONFIG[id] }))

  return (
    <section className="space-y-5">

      {/* ── Section header + filters ── */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground font-heading tracking-tight">
            Location Intelligence Center
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Real nearby amenities, geocoded from OpenStreetMap
          </p>
        </div>

        {/* Interaction Design Sprint 4: single-select proximity filter, not
            separate content panels — modeled as a radiogroup (matches
            native single-select semantics) with the same shared arrow-key
            handler used by Asset Management's tablist. Enterprise
            Geospatial pass: now genuinely drives the map's POI layer, the
            panel's active-filter section, and the bottom strip's
            highlighted stat — not just the fallback simulator. */}
        <div
          role="radiogroup"
          aria-label="Nearby place category"
          className="flex bg-card p-1 rounded-xl border border-border/50 shadow-design-xs self-end md:self-auto"
          onKeyDown={e => handleRovingTabListKeyDown(e, tabs.map(t => t.id), activeTab, id => setActiveTab(id as LocationTab))}
        >
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="radio"
                data-tab-id={tab.id}
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-primary',
                )}
              >
                <tab.icon className="size-3" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Map + Neighborhood panel ── */}
      <div className="grid grid-cols-12 gap-5 h-auto lg:h-150">

        {/* LEFT: Map */}
        <div className="col-span-12 lg:col-span-8 bg-[#f6f5f1] rounded-2xl relative overflow-hidden shadow-design-xs border border-border/40 h-95 lg:h-full group/map">

          {geoPending ? (
            <GeocodingPendingState />
          ) : mapCoords ? (
            <>
              <MapLibreMap
                latitude={mapCoords.latitude}
                longitude={mapCoords.longitude}
                title={propertyLabel}
                propertyCode={propertyCode ?? undefined}
                areaName={locationName ?? undefined}
                city={addressCity ?? undefined}
                propertyType={propertyType ?? undefined}
                status={propertyStatus ?? undefined}
                isApproximate={mapCoords.isApproximate}
                geocodeType={addressGeocodeType ?? undefined}
                lastUpdated={modifiedAt ?? undefined}
                addressText={addressText}
                onFullscreenClick={() => setFullscreenOpen(true)}
                nearbyPlaces={activeNearby}
                searchRadiusM={SEARCH_RADIUS_M}
              />
              {mapCoords.isApproximate && (
                <div className="absolute top-4 right-4 z-20 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  Approximate Location
                </div>
              )}
            </>
          ) : (
            <MapSimulator
              propertyLabel={propertyLabel}
              regionHint={subRegionLocationName ?? regionLocationName ?? undefined}
              locationText={locationSearchText}
              nearby={nearby}
              activeCategories={activeCategories}
            />
          )}

          <BottomStatsStrip
            counts={counts}
            computable={mapCoords != null}
            loading={mapCoords != null && nearbyLoading}
            activeCategories={activeCategories}
          />
        </div>

        {/* RIGHT: Neighborhood intelligence panel */}
        <NeighborhoodPanel
          computable={mapCoords != null}
          loading={mapCoords != null && nearbyLoading}
          locationDisplay={displayLocation}
          propertyType={propertyType ?? undefined}
          propertyStatus={propertyStatus ?? undefined}
          propertyRequestType={propertyRequestType ?? undefined}
          nearby={nearby}
          counts={counts}
          activeTab={activeTab}
        />

      </div>

      {/* ── Fullscreen map experience ──────────────────────────────────────
          Interactive Map Experience phase. Reuses the existing Dialog
          primitive (same one behind the Hero lightbox and Full
          Specifications) rather than the native Fullscreen API — mounts a
          second Leaflet instance sized to the dialog; Leaflet doesn't
          support being moved between containers without an explicit
          invalidateSize() call, so a fresh instance is the safer,
          simpler choice. */}
      {mapCoords && (
        <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
          <DialogContent showCloseButton={false} className="max-w-6xl h-[85vh] border-none p-0 shadow-none gap-0 overflow-hidden">
            <DialogTitle className="sr-only">{propertyLabel} — Location map, fullscreen</DialogTitle>
            <div className="relative h-full w-full">
              <MapLibreMap
                latitude={mapCoords.latitude}
                longitude={mapCoords.longitude}
                title={propertyLabel}
                propertyCode={propertyCode ?? undefined}
                areaName={locationName ?? undefined}
                city={addressCity ?? undefined}
                propertyType={propertyType ?? undefined}
                status={propertyStatus ?? undefined}
                isApproximate={mapCoords.isApproximate}
                geocodeType={addressGeocodeType ?? undefined}
                lastUpdated={modifiedAt ?? undefined}
                addressText={addressText}
                nearbyPlaces={activeNearby}
                searchRadiusM={SEARCH_RADIUS_M}
              />
              <button
                type="button"
                onClick={() => setFullscreenOpen(false)}
                aria-label="Close fullscreen map"
                className="absolute top-4 right-4 z-1000 flex size-9 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X className="size-4" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </section>
  )
}
