'use client'

import { School, Building2, ShoppingBag, Utensils, Bus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNearbyPlaces } from '../hooks/usePropertyLocation'
import {
  formatDistance,
  formatTravelTime,
  type NearbyPlace,
  type PlaceCategory,
} from '../services/geocoding.service'

// ── Category config ───────────────────────────────────────────────────────────

type CategoryConfig = {
  label: string
  icon:  React.ComponentType<{ className?: string }>
  color: string
  bg:    string
}

const CATEGORY_CONFIG: Record<PlaceCategory, CategoryConfig> = {
  school:     { label: 'Schools',           icon: School,      color: 'text-blue-600',   bg: 'bg-blue-500/8'   },
  hospital:   { label: 'Healthcare',        icon: Building2,   color: 'text-rose-600',   bg: 'bg-rose-500/8'   },
  shopping:   { label: 'Shopping',          icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-500/8' },
  restaurant: { label: 'Cafes & Dining',   icon: Utensils,    color: 'text-amber-600',  bg: 'bg-amber-500/8'  },
  metro:      { label: 'Transit Stations', icon: Bus,          color: 'text-emerald-600',bg: 'bg-emerald-500/8'},
}

const CATEGORY_ORDER: PlaceCategory[] = ['school', 'hospital', 'shopping', 'restaurant', 'metro']

// ── GroupedPlaces ─────────────────────────────────────────────────────────────

function PlaceRow({ place }: { place: NearbyPlace }) {
  const { icon: Icon, color, bg } = CATEGORY_CONFIG[place.category]

  return (
    <div className="flex items-center gap-3 border-b border-border/8 py-3.5 last:border-0">
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-[12px]', bg)}>
        <Icon className={cn('size-4', color)} />
      </div>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
        {place.name}
      </span>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-bold tabular-nums text-foreground">
          {formatDistance(place.distance)}
        </p>
        <p className="text-[11px] text-muted-foreground/48">
          {formatTravelTime(place.distance)}
        </p>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NearbyPlacesSkeleton() {
  return (
    <div className="space-y-4">
      {[5, 3, 4, 3].map((count, gi) => (
        <div key={gi}>
          <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-muted/50" />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border/8 py-3.5 last:border-0">
              <div className="size-9 shrink-0 animate-pulse rounded-[12px] bg-muted/40" />
              <div className="h-3.5 flex-1 animate-pulse rounded-full bg-muted/40" />
              <div className="flex flex-col items-end gap-1.5">
                <div className="h-3 w-12 animate-pulse rounded-full bg-muted/40" />
                <div className="h-2.5 w-16 animate-pulse rounded-full bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── NearbyPlaces ──────────────────────────────────────────────────────────────

interface NearbyPlacesProps {
  latitude:  number
  longitude: number
  /** Max places to show per category. Default 4. */
  maxPerCategory?: number
}

export function NearbyPlaces({ latitude, longitude, maxPerCategory = 4 }: NearbyPlacesProps) {
  const { data, isLoading, isError } = useNearbyPlaces(latitude, longitude)

  if (isLoading) {
    return (
      <div>
        <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground/38">
          Nearby Places
        </p>
        <NearbyPlacesSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-[16px] border border-border/18 bg-muted/10 px-5 py-4">
        <AlertCircle className="size-4 shrink-0 text-muted-foreground/30" />
        <p className="text-[13px] text-muted-foreground/45">
          Nearby places could not be loaded right now.
        </p>
      </div>
    )
  }

  const places = data ?? []

  // Group by category, keeping up to maxPerCategory per group, in defined order
  const groups = CATEGORY_ORDER.reduce<Array<{ category: PlaceCategory; places: NearbyPlace[] }>>(
    (acc, cat) => {
      const catPlaces = places
        .filter(p => p.category === cat)
        .slice(0, maxPerCategory)
      if (catPlaces.length > 0) acc.push({ category: cat, places: catPlaces })
      return acc
    },
    [],
  )

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/20 bg-muted/6 py-10 text-center">
        <Bus className="size-5 text-muted-foreground/22" />
        <p className="text-[13px] text-muted-foreground/45">
          No nearby places found within 2 km
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground/38">
        Nearby Places
      </p>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ category, places: catPlaces }) => {
          const { label, icon: Icon, color, bg } = CATEGORY_CONFIG[category]
          return (
            <div key={category}>
              <div className="mb-2 flex items-center gap-2">
                <div className={cn('flex size-6 items-center justify-center rounded-lg', bg)}>
                  <Icon className={cn('size-3', color)} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/45">
                  {label}
                </p>
              </div>
              {catPlaces.map(place => (
                <PlaceRow key={place.id} place={place} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
