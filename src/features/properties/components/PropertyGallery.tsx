'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'

interface PropertyGalleryProps {
  mainImageId?: string | null
  imageIds?:    string[]
  title?:       string
}

export function PropertyGallery({ mainImageId, imageIds = [], title }: PropertyGalleryProps) {
  const allIds = mainImageId
    ? [mainImageId, ...imageIds.filter(id => id !== mainImageId)]
    : imageIds

  const images = allIds.length > 0 ? allIds : [null as string | null]

  const [activeIndex, setActiveIndex]   = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [errored, setErrored]           = useState<Set<number>>(new Set())

  const src = (i: number) =>
    errored.has(i) ? FALLBACK_IMAGE : getWebAssetUrl(images[i])

  const handlePrev = () => setActiveIndex(i => (i - 1 + images.length) % images.length)
  const handleNext = () => setActiveIndex(i => (i + 1) % images.length)
  const onError    = (i: number) => setErrored(s => new Set([...s, i]))

  return (
    <>
      <div className="flex flex-col">

        {/* ── Main image — cinematic 16:9 ratio ─────────────────────────── */}
        <div
          className="group relative aspect-video w-full cursor-zoom-in overflow-hidden bg-muted"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={src(activeIndex)}
            alt={title || 'Property'}
            fill
            priority
            unoptimized
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 1023px) 100vw, 60vw"
            onError={() => onError(activeIndex)}
          />

          {/* Top scrim — title readability */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/30 to-transparent" />

          {/* Bottom atmospheric gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/55 via-black/18 to-transparent" />

          {/* Prev arrow */}
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={e => { e.stopPropagation(); handlePrev() }}
              className={cn(
                'absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center',
                'rounded-full bg-black/55 text-white',
                'opacity-40 transition-[opacity,background-color] duration-150',
                'hover:bg-black/70 hover:opacity-100',
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={e => { e.stopPropagation(); handleNext() }}
              className={cn(
                'absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center',
                'rounded-full bg-black/55 text-white',
                'opacity-40 transition-[opacity,background-color] duration-150',
                'hover:bg-black/70 hover:opacity-100',
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Fullscreen — top-right, always visible */}
          <button
            type="button"
            aria-label="View full screen"
            onClick={e => { e.stopPropagation(); setLightboxOpen(true) }}
            className={cn(
              'absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center',
              'rounded-xl bg-black/55 text-white',
              'opacity-50 transition-opacity duration-150',
              'hover:opacity-100',
            )}
          >
            <Expand className="size-4" />
          </button>

          {/* Image counter — bottom-left, premium pill */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5">
              <span className="text-[11px] font-semibold tabular-nums text-white/90">
                {activeIndex + 1}
              </span>
              <span className="text-[10px] text-white/45">/</span>
              <span className="text-[11px] font-medium tabular-nums text-white/55">
                {images.length}
              </span>
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ───────────────────────────────────────────── */}
        {images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto px-3 pb-3 pt-2.5 [&::-webkit-scrollbar]:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative h-17 w-23 shrink-0 overflow-hidden rounded-xl bg-muted',
                  'transition-[opacity,box-shadow] duration-150',
                  i === activeIndex
                    ? 'ring-2 ring-primary ring-offset-2 opacity-100'
                    : 'opacity-50 hover:opacity-85 hover:ring-1 hover:ring-border/60',
                )}
              >
                <Image
                  src={src(i)}
                  alt={`${title || 'Property'} ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="92px"
                  onError={() => onError(i)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-none bg-black/96 p-0 shadow-none">
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
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/22"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/22"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-[12px] font-medium text-white">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
