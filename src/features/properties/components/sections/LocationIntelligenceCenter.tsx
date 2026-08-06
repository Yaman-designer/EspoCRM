'use client'

import { useMemo, useState } from 'react'
import {
  Building, X, ExternalLink, MapPinOff,
  GraduationCap, Stethoscope, TrainFront, UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { SectionHeader } from '@/components/shared'
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator'
import { usePropertyLocation, useNearbyPlaces } from '../../hooks/usePropertyLocation'
import { handleRovingTabListKeyDown } from '../../lib/keyboard-nav'
import { firstNonEmpty, joinAddressParts } from '@/shared/detail-view'
import {
  countNearbyByCategory, resolveActiveTab, filterNearbyByCategories, resolveMapCoords, SEARCH_RADIUS_M,
  type LocationTab,
} from '../../view-models/location.viewmodel'
import type { NearbyPlace, PlaceCategory } from '../../hooks/usePropertyLocation'
import type { RealEstateProperty } from '../../types/property.types'
import { buildGoogleMapsUrl } from '../../services/geocoding.service'
import { MapLibreMap } from '../PropertyMapLibre'
import { NeighborhoodPanel, LocationSummaryEmptyState, OverviewSentence } from './NeighborhoodPanel'

// ── Nearby-place tab configuration — presentation-layer (icons, the
// category→tab mapping), deliberately NOT in view-models/location.viewmodel.ts.
// Enterprise Geospatial pass (2026-07-19). Real Overpass categories only —
// see geocoding.service.ts's resolveCategory(). "Walk" maps to the two
// lifestyle-adjacent categories that actually exist (dining, shopping);
// there is no walkability score or parks data anywhere in this stack, so
// the tab surfaces real nearby places rather than a fabricated metric.
//
// Enterprise Localization pass (2026-07-24): `label`/`radiusLabel` dropped
// from this config — this is a module-level const (built once, outside any
// component), so it can't call useTranslation. `id` already equals the
// `location.tabs.*`/`location.radiusLabels.*` key suffix, so components
// translate directly off `tab.id` instead of a stored string.
const TAB_CONFIG: Record<LocationTab, { categories: PlaceCategory[]; icon: LucideIcon }> = {
  education: { categories: ['school'],               icon: GraduationCap },
  medical:   { categories: ['hospital'],             icon: Stethoscope },
  transit:   { categories: ['metro'],                icon: TrainFront },
  walk:      { categories: ['restaurant', 'shopping'], icon: UtensilsCrossed },
}
const ALL_TAB_IDS = Object.keys(TAB_CONFIG) as LocationTab[]

interface LocationTabViewModel {
  id: LocationTab
  categories: PlaceCategory[]
  icon: LucideIcon
  count: number
}

/** Only tabs backed by ≥1 real result exist at all — see header note. */
function buildLocationTabs(nearby: NearbyPlace[]): LocationTabViewModel[] {
  const counts = countNearbyByCategory(nearby)
  return ALL_TAB_IDS
    .map(id => ({ id, ...TAB_CONFIG[id], count: TAB_CONFIG[id].categories.reduce((sum, cat) => sum + counts[cat], 0) }))
    .filter(t => t.count > 0)
}

// UX Architecture pass (2026-07-20) — full audit findings and what changed,
// in one place:
//
// REMOVED (fake/decorative, not backed by real data or a real interaction):
//  - MapSimulator: a decorative radar of concentric rings, invented on-screen
//    pin positions, and fake SVG "street" lines. It reused real place names,
//    but its geometry was fiction — a user could reasonably read pin
//    position as direction/distance, which it never was. Replaced with a
//    plain, honest "Map unavailable" state.
//  - The floating black "Approximate Location" badge — reduced to metadata
//    already surfaced inside the popup (isApproximate tag + tooltip), not
//    duplicated as a large always-on overlay dominating the map.
//  - BottomStatsStrip (5-category count strip floating over the map) and
//    the panel's "Amenities Overview" grid — both showed the *same* 5
//    category counts as a third, separate representation, including
//    "None found" tiles for categories with zero results. Consolidated
//    into one place: the filter tabs, which now only render for categories
//    that actually have results, each carrying its own real count inline.
//  - The floating "Open in Google Maps" map control — redundant with the
//    same action already offered as the popup's primary CTA one click away
//    (the marker is always visible); removed per "avoid control
//    duplication."
//  - The dashed-border "No {category} found" empty tile inside the panel —
//    structurally impossible now: a tab only exists in the bar if its
//    category has ≥1 real result, so the active tab's list is never empty.
//
// DYNAMIC (was fixed markup, now generated only from real counts):
//  - Filter tabs — only rendered for categories with count > 0. Zero
//    available tabs means zero nearby data of any kind; the panel then
//    shows one premium empty state instead of iterating five empty cards.
//  - Panel height — no longer stretched to match the map's height via grid
//    row-stretch; sized to its own content (`items-start`), so a panel with
//    one short summary line and one category list is exactly that tall.
//
// Enterprise architecture pass (2026-07-23). Tab/count derivation, active-
// tab resolution, and map-coordinate precedence used to be inline useMemo
// blocks here; all now live in view-models/location.viewmodel.ts. The
// sibling AddressCoordinatesPanel component that used to live in this same
// file is now its own file (AddressCoordinatesPanel.tsx).

interface LocationIntelligenceCenterProps {
  property: RealEstateProperty
}

export function LocationIntelligenceCenter({
  property,
}: LocationIntelligenceCenterProps) {
  const { t } = useTranslation('properties')
  const [selectedTab, setSelectedTab] = useState<LocationTab | null>(null)
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

  const hasRealCoords = addressLatitude != null && addressLongitude != null
  const mapCoords = resolveMapCoords(property, geo)

  // Interactive Map Experience phase. `geoLoading` only means anything while
  // there's no real stored coordinate to short-circuit it — otherwise the
  // map is never actually waiting on this query at all.
  const geoPending = !hasRealCoords && geoLoading

  const { data: nearby = [], isLoading: nearbyLoading } = useNearbyPlaces(
    mapCoords?.latitude  ?? null,
    mapCoords?.longitude ?? null,
  )
  const nearbyPending = mapCoords != null && nearbyLoading

  // Only tabs backed by ≥1 real result exist at all — see header note.
  const tabs = useMemo(() => buildLocationTabs(nearby), [nearby])
  const activeTabId = resolveActiveTab(tabs.map(t => t.id), selectedTab)
  const activeTab: LocationTabViewModel | null = tabs.find(t => t.id === activeTabId) ?? null

  // Enterprise Motion Design pass (2026-07-24): same sliding-indicator
  // primitive as Asset Management's Photos/Legal tablist — see that
  // component's own note and use-sliding-indicator.ts for the rationale.
  // This filter bar wraps to a second line on narrow viewports, which is
  // exactly why the hook tracks y/height too, not just x/width.
  const { containerRef: filterBarRef, registerItem: registerFilterTab, rect: filterIndicatorRect } =
    useSlidingIndicator<HTMLDivElement>(activeTabId ?? '', tabs.map(t => t.id))

  const activeNearby = useMemo(
    () => activeTab ? filterNearbyByCategories(nearby, activeTab.categories) : [],
    [nearby, activeTab],
  )

  const displayLocation = firstNonEmpty(locationName, subRegionLocationName, addressCity) ?? t('location.areaFallback')
  const propertyLabel   = propertyCode ?? locationName ?? t('common.propertyFallback')
  const locationSearchText = firstNonEmpty(locationName, subRegionLocationName, regionLocationName, addressCity)
  const addressText = joinAddressParts([addressStreet, addressCity, addressState, addressPostalCode, addressCountry]) || undefined
  const searchUrl = buildGoogleMapsUrl({ locationText: locationSearchText })

  // Adaptive Layout pass (2026-07-20). The two-column map+panel layout only
  // makes sense when the panel has real, substantial content (a category
  // list) to justify sitting beside a ~600px-tall map. When there's
  // nothing to show there, forcing that same split left a large, inert
  // gap beside the map — a decorative empty area, exactly what an
  // enterprise dashboard shouldn't produce just because a property has
  // little data. `hasAnyData` decides which of two real layouts renders;
  // during the one async gap where the shape isn't known yet
  // (nearbyPending), the richer two-column skeleton is kept rather than
  // guessing — most properties do resolve to some real nearby data, and a
  // reflow triggered by a real, one-time data resolution isn't the
  // decorative-empty-space problem this pass exists to fix.
  const hasAnyData = tabs.length > 0
  const showTwoColumnLayout = nearbyPending || hasAnyData

  const mapContent = geoPending ? (
    <GeocodingPendingState />
  ) : mapCoords ? (
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
  ) : (
    <MapUnavailableState searchUrl={searchUrl} />
  )

  return (
    <section className="space-y-5">

      {/* ── Section header + filters ── */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <SectionHeader title={t('location.title')} subtitle={t('location.subtitle')} />

        {/* Interaction Design Sprint 4: single-select proximity filter, not
            separate content panels — modeled as a radiogroup (matches
            native single-select semantics) with the same shared arrow-key
            handler used by Asset Management's tablist. UX Architecture pass:
            only categories with real results ever appear here, each
            carrying its own live count — this bar IS the "available
            intelligence at a glance" surface, so no separate stats strip or
            summary grid duplicates it elsewhere. */}
        {nearbyPending ? (
          <div className="flex gap-2 self-end md:self-auto" aria-hidden="true">
            {[0, 1, 2].map(i => <div key={i} className="h-7 w-20 rounded-lg bg-muted/25 animate-pulse" />)}
          </div>
        ) : tabs.length > 0 ? (
          <div
            ref={filterBarRef}
            role="radiogroup"
            aria-label={t('location.categoryFilterLabel')}
            className="relative flex flex-wrap bg-card p-1 rounded-xl border border-border/50 shadow-design-xs self-end md:self-auto"
            onKeyDown={e => handleRovingTabListKeyDown(e, tabs.map(t => t.id), activeTabId ?? tabs[0].id, id => setSelectedTab(id as LocationTab))}
          >
            {filterIndicatorRect && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-0 rounded-lg bg-primary shadow-sm',
                  'transition-[transform,width,height] duration-(--duration-large) ease-(--ease-spring)',
                  'motion-reduce:transition-none'
                )}
                style={{
                  transform: `translate(${filterIndicatorRect.x}px, ${filterIndicatorRect.y}px)`,
                  width: filterIndicatorRect.width,
                  height: filterIndicatorRect.height,
                }}
              />
            )}
            {tabs.map(tab => {
              const active = activeTabId === tab.id
              return (
                <button
                  key={tab.id}
                  ref={registerFilterTab(tab.id)}
                  type="button"
                  role="radio"
                  data-tab-id={tab.id}
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setSelectedTab(tab.id)}
                  className={cn(
                    'relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold rounded-lg',
                    'transition-[color,background-color,transform] duration-(--duration-medium) ease-(--ease-premium)',
                    'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    active
                      ? 'text-white'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-primary',
                  )}
                >
                  <tab.icon className="size-3" />
                  {t(`location.tabs.${tab.id}`)}
                  <span className={cn('tabular-nums', active ? 'text-white/70' : 'text-muted-foreground/50')}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* ── Overview sentence — the map's lead-in line ──────────────────────
          Map/Intelligence Transition pass (2026-07-26). Promoted out of the
          neighborhood panel (see NeighborhoodPanel.tsx's own note) so it's
          the first thing read in this section, full-width, before the map
          — on every breakpoint, not just desktop where it used to sit
          beside the map in a side column easy to skip past. Same real
          sentence, same fields; the map now visually continues a claim
          already read instead of competing with it. */}
      <div>
        <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
          {t('location.overview')}
        </h4>
        <OverviewSentence
          locationDisplay={displayLocation}
          propertyType={propertyType ?? undefined}
          propertyStatus={propertyStatus ?? undefined}
          propertyRequestType={propertyRequestType ?? undefined}
        />
      </div>

      {/* ── Map + Neighborhood panel — layout follows content ──────────────
          One grid, always mounted, so switching between the two layouts
          never unmounts/remounts the map itself (a real bug an earlier
          version of this had: branching into two structurally different
          JSX trees for the two-column vs. single-column cases destroyed
          and recreated the entire WebGL map instance the moment loading
          resolved into the no-data case — a real flicker/reload, not just
          a cosmetic issue). Only the map wrapper's column span and the
          second grid child change; the map's own element identity never
          does. */}
      <div className="grid grid-cols-12 gap-4 xl:gap-5 items-start">

        {/* Map — owns its own height; the sibling beside it is no longer
            stretched to match (items-start above), so it can shrink to
            whatever its real content needs. */}
        <div
          className={cn(
            'bg-[#f6f5f1] rounded-2xl relative overflow-hidden shadow-design-xs border border-border/40 h-125 lg:h-150 group/map',
            showTwoColumnLayout ? 'col-span-12 lg:col-span-8' : 'col-span-12',
          )}
        >
          {mapContent}
        </div>

        {showTwoColumnLayout ? (
          <NeighborhoodPanel
            loading={nearbyPending}
            activeNearby={activeNearby}
            activeConfig={activeTab}
          />
        ) : (
          /* Confirmed zero nearby data anywhere: the two-column split has
             nothing real to put in a second column, so it doesn't render
             one — the map above takes the full row, and an honest
             explanation sits in one full-width row beneath it (the real
             summary sentence now lives in this section's own header
             above, shared with the has-data layout), sized to its own
             content instead of a half-empty sidebar. */
          <div className="col-span-12">
            <LocationSummaryEmptyState computable={mapCoords != null} />
          </div>
        )}

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
            <DialogTitle className="sr-only">{t('location.fullscreenMapTitle', { property: propertyLabel })}</DialogTitle>
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
                aria-label={t('location.closeFullscreenMap')}
                // Enterprise Final Review pass (2026-07-23): was `z-1000` —
                // the one z-index on this page outside the app's own
                // established scale (z-10/20/30/50, used consistently for
                // every other overlay/fixed control on this page, including
                // Asset Management's own fullscreen lightbox). MapLibre's own
                // internal controls (PropertyMapLibreInner) top out at
                // z-10, so z-50 — this app's real ceiling — has room to
                // spare above them.
                className="absolute top-4 right-4 z-50 flex size-9 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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

// ── Map unavailable state ──────────────────────────────────────────────────
// Replaces the old MapSimulator: a decorative radar visualization with
// invented on-screen pin positions and fake SVG "street" lines. It reused
// real place names for its labels, but the pin *positions* were pure
// decoration, not derived from real coordinates — exactly the kind of
// visual that reads as data but isn't. This is the honest version: no
// property has coordinates here, so the map says so, and offers the one
// real, non-fabricated fallback action (a text search on the property's
// real location name).

function MapUnavailableState({ searchUrl }: { searchUrl: string | null }) {
  const { t } = useTranslation('properties')
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f6f5f1] text-center px-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
        <MapPinOff className="size-4.5 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-muted-foreground/60">{t('location.mapUnavailable')}</p>
        <p className="text-[10.5px] text-muted-foreground/45 max-w-64 leading-relaxed">
          {t('location.mapUnavailableDesc')}
        </p>
      </div>
      {searchUrl && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-white px-3 py-1.5 text-[10.5px] font-bold text-foreground/70 shadow-design-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ExternalLink className="size-3" />
          {t('location.searchGoogleMaps')}
        </a>
      )}
    </div>
  )
}

// ── Geocoding pending state ────────────────────────────────────────────────

function GeocodingPendingState() {
  const { t } = useTranslation('properties')
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
        {t('location.locatingProperty')}
      </p>
    </div>
  )
}

// NeighborhoodPanel, LocationSummaryEmptyState, and the OverviewSentence/
// NoLocationDataState they share moved to NeighborhoodPanel.tsx (enterprise
// architecture pass, 2026-07-23) — same components, same behavior, no
// visual change.
