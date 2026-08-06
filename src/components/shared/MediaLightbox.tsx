'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Dialog as RadixDialog } from 'radix-ui'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Fullscreen immersive media viewer — promoted from the Property details
// page's `AssetLightbox` (Viewer Experience pass, 2026-07-21). Already had
// zero entity coupling (took ids/resolve/onErr, never a Property field)
// except one prop: `propertyCode`, used only as header chrome text —
// renamed here to a generic `subtitle` so any future Details page's photo/
// document gallery (Vehicle, Employee, ...) can reuse this file verbatim.
//
// Composes Radix's Dialog primitives directly (Portal/Overlay/Content)
// instead of the shared, popup-styled `<DialogContent>` wrapper — audited
// live against real data at every breakpoint and found the popup-styled
// version read as a floating card on a barely-dimmed page, not a true
// fullscreen viewer. Still reuses `Dialog` (Root), `DialogTitle`, and
// `DialogClose` from the shared file for behavior/a11y parity with the
// rest of the app.

export interface MediaLightboxProps {
  ids:          string[]
  resolve:      (id: string | null | undefined, size?: 'small' | 'medium' | 'large') => string
  onErr:        (id: string) => void
  openIndex:    number | null
  onOpenChange: (open: boolean) => void
  onNavigate:   (index: number) => void
  triggerRef:   React.RefObject<HTMLElement | null>
  /** Header chrome, e.g. a reference code — purely decorative text, never fetched here. */
  subtitle?:    string
  /** What's being viewed, e.g. "Photos" / "Legal" — shown in the header and the a11y title. */
  category:     string
}

export function MediaLightbox({ ids, resolve, onErr, openIndex, onOpenChange, onNavigate, triggerRef, subtitle, category }: MediaLightboxProps) {
  const { t } = useTranslation('common')
  const open  = openIndex !== null
  const index = openIndex ?? 0
  const touchStartX = useRef<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

  // Thumbnail Strip UX pass (2026-07-21). Mobile in particular showed only
  // a handful of thumbnails at a time — the strip was scrollable, but
  // nothing ever moved it, so navigating with the arrows, keyboard, or a
  // swipe could push the active thumbnail off-screen with no way back
  // short of the user discovering they could scroll it manually. This
  // keeps the active thumbnail in view automatically on every navigation
  // path (prev/next, keyboard, swipe, or a direct thumbnail click all funnel
  // through `index` changing). Uses `scrollIntoView` on the DOM directly
  // rather than react-managed scroll state — no library, no new gallery
  // logic, purely a presentation reaction to the index that already exists.
  useEffect(() => {
    if (!open) { wasOpenRef.current = false; return }
    const active = stripRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) return
    // First frame after opening: snap instantly so the strip isn't seen
    // animating while the dialog itself is still animating in. Every
    // subsequent index change (any navigation method) scrolls smoothly,
    // unless the user has asked for reduced motion.
    const justOpened = !wasOpenRef.current
    wasOpenRef.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    active.scrollIntoView({ behavior: justOpened || reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
  }, [open, index])

  function prev() { onNavigate((index - 1 + ids.length) % ids.length) }
  function next() { onNavigate((index + 1) % ids.length) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')       { e.preventDefault(); prev() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next() }
  }
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta > 0) prev(); else next()
  }

  // No early `if (!open) return null` here — that would unmount the whole
  // Dialog tree synchronously the instant it closes, before Radix's own
  // close lifecycle (focus-restoration to the trigger, exit animation) gets
  // to run. `open` is passed straight through and Radix decides internally
  // when Content actually leaves the DOM.
  if (ids.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        {/* A near-opaque, blurred backdrop — not the shared bg-black/10 form-
            dialog overlay — is what actually makes this read as an immersive
            viewer instead of a popup sitting on a visible page. */}
        <RadixDialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/92 backdrop-blur-md',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200',
          )}
        />
        <RadixDialog.Content
          onKeyDown={onKeyDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onCloseAutoFocus={e => {
            e.preventDefault()
            triggerRef.current?.focus()
          }}
          className={cn(
            'fixed inset-0 z-50 flex flex-col outline-none',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-98 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-98 duration-200',
            'motion-reduce:animate-none',
          )}
        >
          <DialogTitle className="sr-only">
            {`${category} — ${t('mediaLightbox.imageOfTotal', { index: index + 1, total: ids.length })}${subtitle ? ` — ${subtitle}` : ''}`}
          </DialogTitle>

          {/* Header — a translucent gradient bar, not a solid reserved band,
              so it reads as chrome overlaid on the image rather than a
              separate section competing with it for space. Only real,
              already-available data — nothing fabricated. */}
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 bg-linear-to-b from-black/70 via-black/25 to-transparent px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex min-w-0 items-center gap-2 text-white/90">
              <span className="text-[10.5px] font-bold uppercase tracking-widest">{category}</span>
              {subtitle && (
                <>
                  <span className="text-white/25">·</span>
                  <span className="truncate text-[10.5px] font-semibold text-white/55 tabular-nums">{subtitle}</span>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {ids.length > 1 && (
                <span className="text-[12px] font-medium tabular-nums text-white/70">{index + 1} / {ids.length}</span>
              )}
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label={t('mediaLightbox.close')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all duration-150 hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <X className="size-4.5" />
                </button>
              </DialogClose>
            </div>
          </header>

          {/* Image — the hero. flex-1 (not a fixed vh) so it claims every
              pixel of space the header/thumbnail strip don't need, on any
              viewport height including foldables and landscape tablets. */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* Ambient backdrop — a heavily blurred, darkened cover-fit copy
                of the same photo (same URL, so this is a cache hit, not a
                second real fetch) filling the letterbox gaps object-contain
                leaves for a landscape photo on a portrait screen. */}
            <div key={`${ids[index]}-bg`} className="absolute inset-0 animate-in fade-in-0 duration-500 motion-reduce:animate-none" aria-hidden="true">
              <Image
                src={resolve(ids[index], 'large')}
                alt=""
                fill
                unoptimized
                className="scale-110 object-cover opacity-35 blur-3xl"
                sizes="100vw"
              />
            </div>
            <div key={ids[index]} className="absolute inset-2 sm:inset-4 animate-in fade-in-0 duration-300 motion-reduce:animate-none">
              <Image
                src={resolve(ids[index], 'large')}
                alt={`${category} — ${t('mediaLightbox.imageOfTotal', { index: index + 1, total: ids.length })}`}
                fill
                unoptimized
                className="object-contain"
                sizes="100vw"
                onError={() => onErr(ids[index])}
              />
            </div>

            {ids.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t('mediaLightbox.previousImage')}
                  onClick={prev}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-sm transition-all duration-150 hover:scale-105 hover:bg-white/18 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:left-6 sm:h-12 sm:w-12 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                >
                  <ChevronLeft className="size-5 sm:size-6" />
                </button>
                <button
                  type="button"
                  aria-label={t('mediaLightbox.nextImage')}
                  onClick={next}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-sm transition-all duration-150 hover:scale-105 hover:bg-white/18 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:right-6 sm:h-12 sm:w-12 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                >
                  <ChevronRight className="size-5 sm:size-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip — the only thing in the footer now (the counter
              moved into the header, next to Close, where it reads as part
              of one coherent control cluster instead of a disconnected
              pill). Edge-faded via mask-image so the cut-off at the scroll
              boundary reads as intentional, not a hard clip. `scroll-smooth`
              backs up the JS-driven scrollIntoView above for any manual
              scrolling too. snap-x/snap-center means a swipe settles
              centered on a thumbnail, never mid-frame. */}
          {ids.length > 1 && (
            <div
              ref={stripRef}
              className="shrink-0 scroll-smooth overflow-x-auto pb-4 pt-2 motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)' }}
            >
              <div className="flex snap-x snap-mandatory gap-2 px-5 sm:px-8">
                {ids.map((id, i) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={t('mediaLightbox.viewImage', { index: i + 1 })}
                    aria-current={i === index}
                    data-active={i === index ? 'true' : undefined}
                    onClick={() => onNavigate(i)}
                    className={cn(
                      // Mobile: fewer, larger, touch-friendly thumbnails
                      // (h-14 w-20) rather than the cramped h-9 w-14 that
                      // made the strip hard to target by touch and easy to
                      // scroll past without noticing. sm: and up (tablet/
                      // desktop) is untouched from the prior pass.
                      'relative h-14 w-20 shrink-0 snap-center overflow-hidden rounded-lg transition-all duration-200 motion-reduce:transition-none sm:h-11 sm:w-16',
                      i === index
                        ? 'scale-105 opacity-100 ring-2 ring-white/70'
                        : 'opacity-40 hover:scale-105 hover:opacity-75 motion-reduce:hover:scale-100',
                    )}
                  >
                    <Image src={resolve(id, 'small')} alt="" fill unoptimized className="object-cover" sizes="80px" onError={() => onErr(id)} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </Dialog>
  )
}
