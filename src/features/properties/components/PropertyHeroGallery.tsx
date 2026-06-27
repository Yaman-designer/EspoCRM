'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, Grid3x3 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import type { PropertyStatus } from '../types/property.types'

interface PropertyHeroGalleryProps {
  mainImageId?:  string | null
  imageIds?:     string[]
  title?:        string
  status?:       PropertyStatus
  type?:         string
  propertyCode?: string
}

export function PropertyHeroGallery({
  mainImageId,
  imageIds = [],
  title,
  status,
  type,
  propertyCode,
}: PropertyHeroGalleryProps) {
  const allIds = mainImageId
    ? [mainImageId, ...imageIds.filter(id => id !== mainImageId)]
    : imageIds
  const images = allIds.length > 0 ? allIds : [null as string | null]

  const [activeIndex, setActiveIndex]   = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [errored, setErrored]           = useState<Set<number>>(new Set())

  const src     = (i: number) => errored.has(i) ? FALLBACK_IMAGE : getWebAssetUrl(images[i])
  const onError = (i: number) => setErrored(s => new Set([...s, i]))
  const prev    = () => setActiveIndex(i => (i - 1 + images.length) % images.length)
  const next    = () => setActiveIndex(i => (i + 1) % images.length)

  return (
    <>
      {/* ── Cinematic hero image ─────────────────────────────────────────── */}
      <div
        className="group relative w-full cursor-zoom-in overflow-hidden bg-muted"
        style={{ height: 'clamp(340px, 30vw, 500px)' }}
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={src(activeIndex)}
          alt={title || 'Property'}
          fill
          priority
          unoptimized
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 1023px) 100vw, 65vw"
          onError={() => onError(activeIndex)}
        />

        {/* Top vignette — badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-black/60 via-black/18 to-transparent" />

        {/* Bottom vignette — atmospheric depth */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-linear-to-t from-black/72 via-black/22 to-transparent" />

        {/* ── TOP-LEFT: Status · Type · Reference ─────────────────────── */}
        <div
          className="absolute left-5 top-5 z-20 flex items-center gap-3.5"
          onClick={e => e.stopPropagation()}
        >
          {status && <PropertyStatusBadge status={status} variant="overlay" />}
          {type && (
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/65 [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">
              {type}
            </span>
          )}
          {propertyCode && (
            <span className="text-[10.5px] tabular-nums text-white/38 [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
              #{propertyCode}
            </span>
          )}
        </div>

        {/* ── TOP-RIGHT: Fullscreen ────────────────────────────────────── */}
        <button
          type="button"
          aria-label="View full screen"
          onClick={e => { e.stopPropagation(); setLightboxOpen(true) }}
          className={cn(
            'absolute right-5 top-5 z-20',
            'flex h-9 w-9 items-center justify-center rounded-xl',
            'border border-white/18 bg-black/50 text-white backdrop-blur-sm',
            'opacity-55 transition-opacity duration-200 hover:opacity-90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          )}
        >
          <Expand className="size-3.5" />
        </button>

        {/* ── MIDDLE: Nav arrows ───────────────────────────────────────── */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={e => { e.stopPropagation(); prev() }}
              className={cn(
                'absolute left-4 top-1/2 z-20 -translate-y-1/2',
                'flex h-11 w-11 items-center justify-center rounded-full',
                'border border-white/18 bg-black/50 text-white backdrop-blur-sm',
                'opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100',
                'hover:scale-110 hover:bg-black/68',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={e => { e.stopPropagation(); next() }}
              className={cn(
                'absolute right-4 top-1/2 z-20 -translate-y-1/2',
                'flex h-11 w-11 items-center justify-center rounded-full',
                'border border-white/18 bg-black/50 text-white backdrop-blur-sm',
                'opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100',
                'hover:scale-110 hover:bg-black/68',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* ── BOTTOM: Thumbnails + Photo count ─────────────────────── */}
        {images.length > 1 && (
          <div
            className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-between px-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Thumbnail strip */}
            <div className="flex max-w-[65%] gap-1.5 overflow-x-auto rounded-2xl bg-black/72 p-1.5 backdrop-blur-sm [&::-webkit-scrollbar]:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'relative h-10 w-16 shrink-0 overflow-hidden rounded-xl',
                    'transition-opacity duration-200',
                    i === activeIndex
                      ? 'opacity-100 ring-2 ring-white/60'
                      : 'opacity-45 hover:opacity-75',
                  )}
                >
                  <Image
                    src={src(i)}
                    alt={`${title || 'Property'} ${i + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="64px"
                    onError={() => onError(i)}
                  />
                </button>
              ))}
            </div>

            {/* Photo count pill */}
            <button
              type="button"
              aria-label="View all photos"
              onClick={e => { e.stopPropagation(); setLightboxOpen(true) }}
              className={cn(
                'hidden sm:flex items-center gap-1.5',
                'rounded-full border border-white/18 bg-black/52 px-4 py-2 backdrop-blur-sm',
                'text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white',
                'transition-colors hover:bg-black/68 focus-visible:outline-none',
              )}
            >
              <Grid3x3 className="size-3" />
              {images.length} Photos
            </button>
          </div>
        )}

      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-none bg-black/97 p-0 shadow-none">
          <DialogTitle className="sr-only">{title ?? 'Property gallery'}</DialogTitle>
          <div className="relative flex h-[82vh] items-center justify-center">
            <Image
              src={src(activeIndex)}
              alt={title || 'Property'}
              fill
              unoptimized
              className="object-contain"
              sizes="90vw"
              onError={() => onError(activeIndex)}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/22"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/22"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-[12px] font-medium text-white">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
