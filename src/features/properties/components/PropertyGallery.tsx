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
  // Deduplicate: main image first, then the rest
  const allIds = mainImageId
    ? [mainImageId, ...imageIds.filter(id => id !== mainImageId)]
    : imageIds

  // At least one slot (will show fallback when null)
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
      <div className="flex flex-col gap-2">

        {/* ── Main image ────────────────────────────────────────────────── */}
        <div
          className="group relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={src(activeIndex)}
            alt={title || 'Property'}
            fill
            priority
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 1023px) 100vw, 58vw"
            onError={() => onError(activeIndex)}
          />

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={e => { e.stopPropagation(); handlePrev() }}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={e => { e.stopPropagation(); handleNext() }}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          {/* Expand button */}
          <button
            type="button"
            aria-label="View full screen"
            onClick={e => { e.stopPropagation(); setLightboxOpen(true) }}
            className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          >
            <Expand className="size-3.5" />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ───────────────────────────────────────────── */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted transition-all duration-150',
                  i === activeIndex
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'opacity-55 hover:opacity-90',
                )}
              >
                <Image
                  src={src(i)}
                  alt={`${title || 'Property'} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
