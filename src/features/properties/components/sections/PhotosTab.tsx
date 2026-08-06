'use client'

import Image from 'next/image'
import { Camera, Expand } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared'

// Asset Management UX Architecture pass (2026-07-21). Two real bugs fixed:
//
// 1. The grid always rendered 4 fixed slots regardless of how many photos
//    actually exist — a property with 1-3 images showed real photos next to
//    grey "no image" filler boxes for the missing slots. The grid now
//    composes itself from `allIds.length` (1 / 2 / 3 / 4+), so a
//    one-photo property gets one full tile, never an empty container.
// 2. Every tile was inert — no onClick anywhere in this file, including the
//    "+N Asset Stack" overflow tile, which looked like a "view more"
//    control but did nothing. Every tile now opens the shared lightbox
//    below at its own index.
//
// Also removed: "Interior View" / "Property View" captions on the 2nd/3rd
// tiles. Nothing in the API says what a given photo depicts — EspoCRM's
// `images` attachmentMultiple carries no per-image caption/tag field — so
// asserting "this one is the interior" was a fabricated content claim, not
// a rendered fact. Replaced with a neutral hover affordance (expand icon)
// used identically on every tile, which communicates "this opens" without
// claiming what it shows.
//
// Enterprise architecture pass (2026-07-23): split out of
// AssetManagementSystem.tsx (was 828 lines) into its own file — same
// component, same behavior, no visual change.

interface PhotosTabProps {
  allIds:  string[]
  resolve: (id: string | null | undefined, size?: 'small' | 'medium' | 'large') => string
  onErr:   (id: string) => void
  onOpen:  (index: number) => void
}

export function PhotosTab({ allIds, resolve, onErr, onOpen }: PhotosTabProps) {
  const { t } = useTranslation('properties')
  const count = allIds.length

  if (count === 0) {
    return (
      <EmptyState
        icon={Camera}
        title={t('assets.photosTab.emptyTitle')}
        description={t('assets.photosTab.emptyDesc')}
      />
    )
  }

  if (count === 1) {
    return (
      <div className="h-full">
        <PhotoTile id={allIds[0]} index={0} primary priority resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 100vw, 50vw" className="h-full" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
        <PhotoTile id={allIds[0]} index={0} primary priority resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 100vw, 50vw" className="min-h-52 sm:min-h-0" />
        <PhotoTile id={allIds[1]} index={1} resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 100vw, 50vw" className="min-h-52 sm:min-h-0" />
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 lg:grid-rows-2 gap-4 h-full">
        <PhotoTile id={allIds[0]} index={0} primary priority resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 100vw, 50vw" className="col-span-2 lg:col-span-1 lg:row-span-2 min-h-52 lg:min-h-0" />
        <PhotoTile id={allIds[1]} index={1} resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 50vw, 25vw" className="min-h-36 lg:min-h-0" />
        <PhotoTile id={allIds[2]} index={2} resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 50vw, 25vw" className="min-h-36 lg:min-h-0" />
      </div>
    )
  }

  // count >= 4 — hero + 2 secondary tiles + an overflow tile that either
  // shows the plain 4th photo (count === 4, nothing more to reveal) or a
  // dimmed 4th photo with a real "+N" count (count > 4).
  const remaining = Math.max(0, count - 4)

  return (
    <div className="grid grid-cols-4 lg:grid-rows-2 gap-4 h-full">
      <PhotoTile id={allIds[0]} index={0} primary priority resolve={resolve} onErr={onErr} onOpen={onOpen}
        sizes="(max-width: 1024px) 100vw, 50vw" className="col-span-4 lg:col-span-2 lg:row-span-2 min-h-52 lg:min-h-0" />
      <PhotoTile id={allIds[1]} index={1} resolve={resolve} onErr={onErr} onOpen={onOpen}
        sizes="(max-width: 1024px) 100vw, 50vw" className="col-span-4 lg:col-span-2 min-h-36 lg:min-h-0" />
      <PhotoTile id={allIds[2]} index={2} resolve={resolve} onErr={onErr} onOpen={onOpen}
        sizes="(max-width: 1024px) 50vw, 25vw" className="col-span-2 lg:col-span-1 min-h-28 lg:min-h-0" />
      {remaining > 0 ? (
        <OverflowTile id={allIds[3]} remaining={remaining} resolve={resolve} onErr={onErr}
          onOpen={() => onOpen(3)} className="col-span-2 lg:col-span-1 min-h-28 lg:min-h-0" />
      ) : (
        <PhotoTile id={allIds[3]} index={3} resolve={resolve} onErr={onErr} onOpen={onOpen}
          sizes="(max-width: 1024px) 50vw, 25vw" className="col-span-2 lg:col-span-1 min-h-28 lg:min-h-0" />
      )}
    </div>
  )
}

// ── PhotoTile — one clickable grid tile, shared by every count-based layout ──

interface PhotoTileProps {
  id:       string
  index:    number
  resolve:  (id: string | null | undefined, size?: 'small' | 'medium' | 'large') => string
  onErr:    (id: string) => void
  onOpen:   (index: number) => void
  sizes:    string
  className?: string
  primary?: boolean
  priority?: boolean
}

function PhotoTile({ id, index, resolve, onErr, onOpen, sizes, className, primary, priority }: PhotoTileProps) {
  const { t } = useTranslation('properties')
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      aria-label={primary ? t('assets.photosTab.viewPrimaryPhoto') : t('assets.photosTab.viewPhoto', { index: index + 1 })}
      className={cn(
        // w-full: a <button> is inline-level by default and won't stretch
        // to fill a plain block parent (only a flex/grid parent's default
        // stretch alignment masks this) — the count===1 layout wraps this
        // in a plain div, which collapsed to ~2px wide without this.
        'group relative w-full overflow-hidden rounded-[24px] border border-border shadow-sm text-left cursor-zoom-in',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <Image
        src={resolve(id)}
        alt=""
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        onError={() => onErr(id)}
      />
      {primary && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl border border-white/20 px-3 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider">
          {t('assets.photosTab.primaryPhoto')}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20 motion-reduce:transition-none">
        <Expand className="size-5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none drop-shadow" />
      </div>
    </button>
  )
}

// ── OverflowTile — the 4th slot when more photos exist beyond it ────────────

interface OverflowTileProps {
  id:       string
  remaining: number
  resolve:  (id: string | null | undefined, size?: 'small' | 'medium' | 'large') => string
  onErr:    (id: string) => void
  onOpen:   () => void
  className?: string
}

function OverflowTile({ id, remaining, resolve, onErr, onOpen, className }: OverflowTileProps) {
  const { t } = useTranslation('properties')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('assets.photosTab.viewAllPhotos', { count: remaining + 4 })}
      className={cn(
        'group relative w-full overflow-hidden rounded-[24px] border border-border shadow-sm bg-slate-900 text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <Image
        src={resolve(id)}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 1024px) 50vw, 25vw"
        className="object-cover opacity-60 transition-opacity duration-200 group-hover:opacity-40 motion-reduce:transition-none"
        onError={() => onErr(id)}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="font-heading font-black text-3xl tracking-tighter">+{remaining}</span>
        <span className="text-[9px] font-black uppercase tracking-wider">{t('assets.photosTab.assetStack')}</span>
      </div>
    </button>
  )
}
