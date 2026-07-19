'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RealEstateProperty } from '../../types/property.types'

// IA Sprint 3 (2026-07-18). Split out of ExecutiveBriefingCard, which
// previously carried both a synthesized one-line brief and this raw,
// unbounded description text in the same card — a card meant to be a
// 3-second read shouldn't also vary in height with however long the
// agent's marketing copy happens to be. Clamped to 4 lines by default with
// an expand toggle, so a long description no longer dictates the height of
// the page's opening section.
//
// Progressive-disclosure polish pass (2026-07-18). Three changes from the
// original toggle:
//   1. The "Read more" control only renders when the text actually
//      overflows 4 lines — measured live via ResizeObserver against the
//      clamped element's own scrollHeight vs. clientHeight, not guessed.
//      A short description no longer shows a pointless button.
//   2. The cut is a soft fade (a gradient overlay matching the card
//      surface) instead of a hard clip.
//   3. Expand/collapse animates — the wrapper's max-height is measured
//      from the real, currently-rendered DOM (so it's correct at any
//      viewport width or fluid font size) and transitioned with CSS,
//      instead of snapping instantly between clamped and unclamped.

interface ListingDescriptionCardProps {
  property: Pick<RealEstateProperty, 'description' | 'cDescriptionGr'>
}

export function ListingDescriptionCard({ property }: ListingDescriptionCardProps) {
  const { description, cDescriptionGr } = property
  const [expanded, setExpanded]   = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    function measure() {
      if (!el) return
      setTruncated(el.scrollHeight > el.clientHeight + 1)
      setMaxHeight(expanded ? el.scrollHeight : el.clientHeight)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [expanded, description, cDescriptionGr])

  if (!description && !cDescriptionGr) return null

  return (
    <div className="bg-card rounded-2xl border border-border/40 shadow-design-xs p-[clamp(1.25rem,1.05rem+0.9vw,2rem)]">
      <p className="mb-3 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em]">
        Listing Description
      </p>

      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{ maxHeight: maxHeight != null ? `${maxHeight}px` : undefined }}
      >
        <div
          ref={contentRef}
          className={cn('space-y-4', !expanded && 'line-clamp-4')}
        >
          {description && (
            <p className="text-[clamp(0.875rem,0.83rem+0.2vw,0.9375rem)] leading-relaxed text-foreground/75 whitespace-pre-line max-w-[68ch]">
              {description}
            </p>
          )}
          {cDescriptionGr && (
            <p className="text-[clamp(0.875rem,0.83rem+0.2vw,0.9375rem)] leading-relaxed text-foreground/60 whitespace-pre-line max-w-[68ch]" lang="el">
              {cDescriptionGr}
            </p>
          )}
        </div>

        {!expanded && truncated && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-linear-to-t from-card to-transparent" />
        )}
      </div>

      {truncated && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className={cn(
            'mt-3 -ml-0.5 inline-flex items-center gap-1.5 rounded-md px-0.5 py-0.5',
            'text-[11px] font-bold uppercase tracking-wide text-muted-foreground/55',
            'transition-colors duration-200 hover:text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
        >
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown className={cn('size-3 transition-transform duration-300 ease-out', expanded && 'rotate-180')} />
        </button>
      )}
    </div>
  )
}
