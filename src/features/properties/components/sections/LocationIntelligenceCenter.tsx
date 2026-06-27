'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Building, Train, PersonStanding } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePropertyLocation, useNearbyPlaces } from '../../hooks/usePropertyLocation'
import type { NearbyPlace } from '../../hooks/usePropertyLocation'
import type { RealEstateProperty } from '../../types/property.types'
import type { PropertyMapLeafletProps } from '../PropertyMapLeaflet'

// ── Dynamic Leaflet import (SSR-safe, no wrapper overhead) ────────────────────

const LeafletMap = dynamic<PropertyMapLeafletProps>(
  () => import('../PropertyMapLeaflet').then(m => ({ default: m.PropertyMapLeaflet })),
  { ssr: false },
)

// ── Types ──────────────────────────────────────────────────────────────────────

type LocationTab = 'education' | 'medical' | 'transit' | 'walk'

const TAB_CATEGORY: Record<LocationTab, string> = {
  education: 'school',
  medical:   'hospital',
  transit:   'metro',
  walk:      'restaurant',
}

// Stitch: mapPins use absolute top/left — deterministic positions for API pins
const SIM_PIN_POSITIONS = [
  { top: '18%', left: '14%' },
  { top: '66%', left: '12%' },
  { top: '16%', left: '62%' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function distStr(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

// ── Bottom stats strip (overlaid on map or simulator) ─────────────────────────

function BottomStatsStrip({ nearby }: { nearby: NearbyPlace[] }) {
  const restaurants  = nearby.filter(p => p.category === 'restaurant')
  const metros       = nearby.filter(p => p.category === 'metro')
  const schools      = nearby.filter(p => p.category === 'school')
  const nearestMetro = metros.length > 0
    ? metros.reduce((a, b) => a.distance < b.distance ? a : b)
    : null

  return (
    // Stitch: absolute bottom-6 left-6 right-6 lg:right-auto
    <div className="absolute bottom-6 left-6 right-6 lg:right-auto z-10">
      {/* Stitch: bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-white/60
                 flex items-center justify-between lg:justify-start gap-6 lg:gap-8 overflow-x-auto no-scrollbar */}
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-white/60 flex items-center justify-between lg:justify-start gap-6 lg:gap-8 overflow-x-auto no-scrollbar">

        {/* Restaurants Nearby — truthful label for restaurant count */}
        <div className="text-center shrink-0">
          {/* Stitch: text-2xl font-black text-text-main font-headline tracking-tighter */}
          <div className="text-2xl font-black text-foreground font-heading tracking-tighter">
            {restaurants.length > 0 ? restaurants.length : '—'}
          </div>
          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Restaurants Nearby
          </div>
        </div>

        <div className="w-px h-8 bg-border shrink-0" />

        {/* Transit Points — truthful label for metro/bus count */}
        <div className="text-center shrink-0">
          <div className="text-2xl font-black text-foreground font-heading tracking-tighter">
            {metros.length > 0 ? metros.length : '—'}
          </div>
          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Transit Points
          </div>
        </div>

        <div className="w-px h-8 bg-border shrink-0" />

        {/* Schools Nearby — truthful label for school count (emerald) */}
        <div className="text-center shrink-0">
          {/* Stitch: text-emerald font-headline */}
          <div className="text-2xl font-black text-brand-emerald font-heading tracking-tighter">
            {schools.length > 0 ? schools.length : '—'}
          </div>
          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Schools Nearby
          </div>
        </div>

        <div className="w-px h-8 bg-border shrink-0" />

        {/* Nearest Transit — truthful label for metro distance (azure) */}
        <div className="text-center shrink-0">
          {/* Stitch: text-azure font-headline */}
          <div className="text-2xl font-black text-brand-azure font-heading tracking-tighter">
            {nearestMetro ? distStr(nearestMetro.distance) : '—'}
          </div>
          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Nearest Transit
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Map simulator (Stitch visual shell — shown when real geo is unavailable) ───

function MapSimulator({
  propertyLabel,
  regionHint,
  nearby,
  activeTab,
}: {
  propertyLabel: string
  regionHint?:   string
  nearby:        NearbyPlace[]
  activeTab:     LocationTab
}) {
  const tabPlaces = nearby
    .filter(p => p.category === TAB_CATEGORY[activeTab])
    .slice(0, 3)

  return (
    <>
      {/* Stitch: distance rings with labels */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        {/* Inner ring — ~4 min drive (Stitch: w-[280px] h-[280px] border border-primary/20) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-70 h-70 border border-primary/20 rounded-full flex items-center justify-center">
          <div className="absolute top-0 text-[8px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/10 shadow-sm whitespace-nowrap">
            4 min drive
          </div>
        </div>
        {/* Outer ring — ~10 min transit (Stitch: w-[480px] h-[480px] border border-primary/10) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 border border-primary/10 rounded-full flex items-center justify-center">
          <div className="absolute top-0 text-[8px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/10 shadow-sm whitespace-nowrap">
            10 min transit
          </div>
        </div>
      </div>

      {/* Stitch: SVG map vector grid lines opacity-30 */}
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

      {/* Stitch: dynamic map pins (from active tab's real nearby places) */}
      {tabPlaces.map((place, i) => (
        <div
          key={place.id}
          style={{ top: SIM_PIN_POSITIONS[i]?.top, left: SIM_PIN_POSITIONS[i]?.left }}
          className="absolute transition-transform duration-500 hover:scale-105"
        >
          <div className="relative flex flex-col items-center gap-1">
            {/* Stitch: bg-white shadow-md px-3 py-1.5 rounded-full border border-border flex items-center gap-2 */}
            <div className="bg-white shadow-md px-3 py-1.5 rounded-full border border-border flex items-center gap-2 cursor-pointer hover:shadow-lg">
              {/* Stitch: w-2 h-2 rounded-full bg-emerald */}
              <span className="w-2 h-2 rounded-full bg-brand-emerald shrink-0" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-tight whitespace-nowrap max-w-28 truncate">
                {place.name}
              </span>
            </div>
            {/* Stitch: bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full */}
            <div className="bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {distStr(place.distance)}
            </div>
          </div>
        </div>
      ))}

      {/* Stitch: central property pin — absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="relative">
          {/* Stitch: absolute -inset-6 bg-primary/10 rounded-full animate-ping */}
          <div className="absolute -inset-6 bg-primary/10 rounded-full animate-ping" />
          {/* Stitch: bg-primary w-14 h-14 rounded-[20px] shadow-lg border-4 border-white Building icon */}
          <div className="bg-primary text-white w-14 h-14 rounded-[20px] shadow-lg flex items-center justify-center border-4 border-white relative z-10 hover:scale-105 transition-transform cursor-pointer">
            <Building className="w-6 h-6" />
            {/* Stitch: triangle pointer — border-t-primary */}
            <div className="absolute -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary" />
          </div>
        </div>
        {/* Stitch: bg-navy → bg-foreground, text-white, px-4 py-2 rounded-xl uppercase tracking-widest
            Real label: property code / location name + region if available (no fabricated text) */}
        <div className="mt-4 bg-foreground text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg border border-white/10 uppercase tracking-widest whitespace-nowrap">
          {propertyLabel}{regionHint ? ` · ${regionHint}` : ''}
        </div>
      </div>
    </>
  )
}

// ── Neighborhood sidebar (right panel) ────────────────────────────────────────

function NeighborhoodSidebar({
  locationDisplay,
  propertyType,
  propertyStatus,
  propertyPurpose,
  nearby,
}: {
  locationDisplay:  string
  propertyType?:    string
  propertyStatus?:  string
  propertyPurpose?: string
  nearby:           NearbyPlace[]
}) {
  const nearestTransit    = nearby.filter(p => p.category === 'metro')[0]
  const nearestRestaurant = nearby.filter(p => p.category === 'restaurant')[0]

  return (
    // Stitch: col-span-12 lg:col-span-4 bg-white border border-border rounded-[32px] p-6 lg:p-8 shadow-sm
    //         flex flex-col justify-between h-95 lg:h-full
    <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col justify-between h-95 lg:h-full">

      <div className="space-y-6">

        {/* Stitch: h4 text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 */}
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Neighborhood Signal Analysis
        </h4>

        {/* Stitch: p-5 bg-background/50 rounded-2xl border border-border relative overflow-hidden */}
        <div className="p-5 bg-background/50 rounded-2xl border border-border relative overflow-hidden">
          {/* Stitch: absolute top-0 left-0 w-1.5 h-full bg-emerald rounded-full */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-emerald rounded-full" />
          {/* Narrative — real property fields replace Stitch fake market text */}
          <p className="text-sm text-foreground font-semibold leading-relaxed">
            {locationDisplay} —{' '}
            {/* Stitch: <span className="text-emerald font-black"> — truthful type + purpose */}
            <span className="text-brand-emerald font-black">
              {propertyType?.toLowerCase() ?? 'property'}
              {propertyPurpose ? ` for ${propertyPurpose.toLowerCase()}` : ''}
            </span>
            {propertyStatus ? (
              <>
                {', currently '}
                {/* Stitch: <span className="font-bold underline decoration-emerald/40 underline-offset-4"> */}
                <span className="font-bold underline decoration-brand-emerald/40 underline-offset-4">
                  {propertyStatus.toLowerCase()}
                </span>
              </>
            ) : null}
            {'.'}
          </p>
        </div>

        {/* Stitch: space-y-3 POI rows */}
        <div className="space-y-3">

          {/* Transit row — azure (Stitch: bg-azure/10 text-azure) */}
          <div className="flex items-center justify-between p-3.5 hover:bg-background rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-border group/item">
            <div className="flex items-center gap-4">
              {/* Stitch: w-10 h-10 bg-azure/10 text-azure rounded-xl */}
              <div className="w-10 h-10 bg-brand-azure/10 text-brand-azure rounded-xl flex items-center justify-center group-hover/item:scale-105 transition-transform">
                <Train className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-foreground">
                {nearestTransit ? nearestTransit.name : 'Transit Access'}
              </span>
            </div>
            {/* Stitch: text-[9px] font-black text-text-muted uppercase bg-border/40 px-2.5 py-1 rounded-full */}
            <span className="text-[9px] font-black text-muted-foreground uppercase bg-border/40 px-2.5 py-1 rounded-full shrink-0">
              {nearestTransit ? distStr(nearestTransit.distance) : '—'}
            </span>
          </div>

          {/* Walk/dining row — emerald (Stitch: bg-emerald/10 text-emerald) */}
          <div className="flex items-center justify-between p-3.5 hover:bg-background rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-border group/item">
            <div className="flex items-center gap-4">
              {/* Stitch: w-10 h-10 bg-emerald/10 text-emerald rounded-xl */}
              <div className="w-10 h-10 bg-brand-emerald/10 text-brand-emerald rounded-xl flex items-center justify-center group-hover/item:scale-105 transition-transform">
                <PersonStanding className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-foreground">
                {nearestRestaurant ? nearestRestaurant.name : 'Dining Nearby'}
              </span>
            </div>
            <span className="text-[9px] font-black text-muted-foreground uppercase bg-border/40 px-2.5 py-1 rounded-full shrink-0">
              {nearestRestaurant ? distStr(nearestRestaurant.distance) : '—'}
            </span>
          </div>

        </div>
      </div>

    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface LocationIntelligenceCenterProps {
  property: RealEstateProperty
}

export function LocationIntelligenceCenter({
  property,
}: LocationIntelligenceCenterProps) {
  const [activeTab, setActiveTab] = useState<LocationTab>('education')

  const {
    locationName,
    subRegionLocationName,
    regionLocationName,
    addressCity,
    propertyCode,
    type:    propertyType,
    status:  propertyStatus,
    purpose: propertyPurpose,
  } = property

  const { data: geo } = usePropertyLocation({
    locationName,
    subRegionLocationName,
    regionLocationName,
  })

  const { data: nearby = [] } = useNearbyPlaces(
    geo?.latitude  ?? null,
    geo?.longitude ?? null,
  )

  const displayLocation = locationName || subRegionLocationName || addressCity || 'Area Location'
  const propertyLabel   = propertyCode ?? locationName ?? 'Property'

  const tabs: Array<{ id: LocationTab; label: string }> = [
    { id: 'education', label: 'Education' },
    { id: 'medical',   label: 'Medical'   },
    { id: 'transit',   label: 'Transit'   },
    { id: 'walk',      label: 'Walk'      },
  ]

  return (
    // Stitch: <section className="space-y-6"> (mt-16 handled by parent spacing)
    <section className="space-y-6">

      {/* Stitch: flex flex-col md:flex-row md:items-baseline justify-between gap-4 */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          {/* Stitch: text-2xl font-black text-text-main font-headline tracking-tight */}
          <h2 className="text-xl font-black text-foreground font-heading tracking-tight">
            Location Intelligence Center
          </h2>
        </div>

        {/* Stitch: flex items-center gap-6 self-end md:self-auto */}
        <div className="flex items-center gap-6 self-end md:self-auto">
          {/* Stitch: flex bg-white p-1 rounded-xl border border-border shadow-xs */}
          <div className="flex bg-card p-1 rounded-xl border border-border shadow-xs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Stitch: text-xs text-text-muted font-bold tracking-wider uppercase hidden sm:block */}
          <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase hidden sm:block">
            Geo-Spatial Analysis
          </p>
        </div>
      </div>

      {/* Stitch: grid grid-cols-12 gap-8 h-auto lg:h-150 */}
      <div className="grid grid-cols-12 gap-8 h-auto lg:h-150">

        {/* ── LEFT: Map container ── */}
        {/* Stitch: col-span-12 lg:col-span-8 bg-slate-50 rounded-[32px] relative overflow-hidden
                   shadow-lg border border-border map-grid h-95 lg:h-full group/map */}
        <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-[32px] relative overflow-hidden shadow-lg border border-border map-grid h-95 lg:h-full group/map">

          {geo ? (
            // Real Leaflet map — fills container via height:100% on MapContainer
            <LeafletMap
              latitude={geo.latitude}
              longitude={geo.longitude}
              title={propertyLabel}
              propertyCode={propertyCode ?? undefined}
              areaName={locationName ?? undefined}
            />
          ) : (
            // Stitch map simulator shell — shown when coordinates unavailable or loading
            <MapSimulator
              propertyLabel={propertyLabel}
              regionHint={subRegionLocationName ?? regionLocationName ?? undefined}
              nearby={nearby}
              activeTab={activeTab}
            />
          )}

          {/* Bottom stats strip — always overlaid (real data or "—" when unavailable) */}
          <BottomStatsStrip nearby={nearby} />

        </div>

        {/* ── RIGHT: Neighborhood sidebar ── */}
        <NeighborhoodSidebar
          locationDisplay={displayLocation}
          propertyType={propertyType ?? undefined}
          propertyStatus={propertyStatus ?? undefined}
          propertyPurpose={propertyPurpose ?? undefined}
          nearby={nearby}
        />

      </div>
    </section>
  )
}
