'use client'

/**
 * PropertyMap — SSR-safe wrapper around the Leaflet map.
 *
 * Leaflet accesses `window` at module load time, so it must only run on the
 * client. We use `dynamic()` with `ssr: false` to skip server-side rendering
 * of the inner component entirely.
 */

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { PropertyMapLeafletProps } from './PropertyMapLeaflet'

// ── Loading skeleton (shown while Leaflet chunk loads) ────────────────────────

function MapSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-[#EAF4FF] via-[#EEF5FF] to-[#E5EEFF]">
      {/* Animated dot matrix */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,97,188,0.30) 1px, transparent 1px)',
          backgroundSize:  '22px 22px',
        }}
      />
      {/* Pulsing marker */}
      <div className="relative flex size-14 animate-pulse items-center justify-center rounded-full bg-primary/25 ring-8 ring-primary/8" />
      <div className="h-4 w-28 animate-pulse rounded-full bg-white/60 shadow-sm" />
    </div>
  )
}

// ── Dynamic import (no SSR) ───────────────────────────────────────────────────

const LeafletMap = dynamic<PropertyMapLeafletProps>(
  () => import('./PropertyMapLeaflet').then(m => m.PropertyMapLeaflet),
  { ssr: false, loading: MapSkeleton },
)

// ── PropertyMap ───────────────────────────────────────────────────────────────

interface PropertyMapProps extends PropertyMapLeafletProps {
  className?: string
  height?:    number   // px, default 420
}

export function PropertyMap({ className, height = 420, ...leafletProps }: PropertyMapProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[24px]',
        'border border-border/18',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06)]',
        className,
      )}
      style={{ height }}
    >
      <LeafletMap {...leafletProps} />
    </div>
  )
}
