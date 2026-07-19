'use client'

/**
 * PropertyMapLibre — SSR-safe dynamic-import wrapper around the MapLibre
 * GL JS map, mirroring PropertyMap.tsx's pattern for the Leaflet map.
 * MapLibre accesses `window`/WebGL at module load time, same constraint.
 */

import dynamic from 'next/dynamic'
import type { PropertyMapLibreProps } from './PropertyMapLibreInner'

function MapLibreSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-[#EAF4FF] via-[#EEF5FF] to-[#E5EEFF]">
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,97,188,0.30) 1px, transparent 1px)',
          backgroundSize:  '22px 22px',
        }}
      />
      <div className="relative flex size-14 animate-pulse items-center justify-center rounded-full bg-primary/25 ring-8 ring-primary/8" />
      <div className="h-4 w-28 animate-pulse rounded-full bg-white/60 shadow-sm" />
    </div>
  )
}

export const MapLibreMap = dynamic<PropertyMapLibreProps>(
  () => import('./PropertyMapLibreInner').then(m => m.PropertyMapLibre),
  { ssr: false, loading: MapLibreSkeleton },
)
