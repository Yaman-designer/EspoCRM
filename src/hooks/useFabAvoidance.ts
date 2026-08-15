'use client'

import * as React from 'react'

export type FabAvoidMode = 'docked' | 'inflow'

export interface FabAvoidSource {
  /** CSS selector for an element the FAB must never cover. */
  selector: string
  /**
   * 'docked'  — element is pinned at the viewport bottom whenever it's
   *             mounted (e.g. a sticky action bar), so its full height is
   *             always reserved.
   * 'inflow'  — element scrolls with the page (e.g. a table's pagination
   *             footer), so its height is only reserved while it is
   *             actually on screen.
   */
  mode: FabAvoidMode
}

/**
 * Computes the bottom clearance (px) a fixed-position FAB needs so it never
 * overlaps any of `sources`. Each source component mounts/unmounts as
 * routes change, so a one-time querySelector would miss ones that appear
 * later — a MutationObserver (re)attaches to each selector whenever it
 * shows up.
 *
 * 'docked' clearance is the element's own height (live ResizeObserver,
 * never a hardcoded value) — correct because a docked element is always
 * pinned flush to the viewport's bottom edge.
 *
 * 'inflow' clearance is the live distance from the viewport's bottom edge
 * to the element's own top edge, tracked on scroll while an
 * IntersectionObserver reports it on screen (0 otherwise — a pagination
 * footer scrolled far below the fold shouldn't push the FAB up). This is
 * deliberately NOT the element's own height: an in-flow element isn't
 * necessarily flush against the true end of scrollable content (e.g.
 * BottomNav's own bottom padding on <main> reserves space after it), so
 * height alone can under-clear it.
 *
 * Sources never stack: the result is the max of all active clearances,
 * since each one is an alternate resting floor for the FAB, not a pile.
 */
export function useFabAvoidance(sources: FabAvoidSource[]): number {
  const [clearances, setClearances] = React.useState<Record<number, number>>({})

  React.useEffect(() => {
    const cleanups: Array<() => void> = []

    sources.forEach((source, index) => {
      let resizeObserver: ResizeObserver | null = null
      let intersectionObserver: IntersectionObserver | null = null
      let inflowRafId: number | null = null
      let removeInflowScrollListener: (() => void) | null = null

      const setClearance = (value: number) => {
        setClearances((prev) => (prev[index] === value ? prev : { ...prev, [index]: value }))
      }

      const stopInflowTracking = () => {
        removeInflowScrollListener?.()
        removeInflowScrollListener = null
        if (inflowRafId != null) { cancelAnimationFrame(inflowRafId); inflowRafId = null }
      }

      const attach = (el: HTMLElement) => {
        const alwaysOn = source.mode === 'docked'

        resizeObserver = new ResizeObserver(() => {
          if (alwaysOn) setClearance(el.offsetHeight)
        })
        resizeObserver.observe(el)

        if (alwaysOn) {
          setClearance(el.offsetHeight)
          return
        }

        // 'inflow': the FAB needs clearance equal to the distance from the
        // viewport's bottom edge to this element's own top edge — NOT the
        // element's own height. Those only coincide when the element sits
        // flush against the true end of scrollable content; once something
        // else reserves space below it (e.g. BottomNav's own bottom padding
        // on <main>), the element's top can sit well above where
        // `el.offsetHeight` alone would place the FAB, letting the FAB rest
        // on top of it instead of above it (confirmed live: the Back to Top
        // button overlapping PropertyPagination's page-size control on
        // mobile). Tracked continuously via scroll while the element is
        // actually on screen — a one-time read on intersection-enter would
        // go stale the instant the user keeps scrolling further. rAF-
        // coalesced, same pattern BackToTopButton's own show/hide listener
        // already uses, so this isn't a second, independent scroll-tracking
        // mechanism — same technique, just applied here too.
        const recomputeInflow = () => {
          inflowRafId = null
          setClearance(Math.max(0, window.innerHeight - el.getBoundingClientRect().top))
        }
        const scheduleRecompute = () => {
          if (inflowRafId != null) return
          inflowRafId = requestAnimationFrame(recomputeInflow)
        }

        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              recomputeInflow()
              window.addEventListener('scroll', scheduleRecompute, { passive: true })
              removeInflowScrollListener = () => window.removeEventListener('scroll', scheduleRecompute)
            } else {
              stopInflowTracking()
              setClearance(0)
            }
          },
          { threshold: 0 },
        )
        intersectionObserver.observe(el)
      }

      const detach = () => {
        resizeObserver?.disconnect()
        resizeObserver = null
        intersectionObserver?.disconnect()
        intersectionObserver = null
        stopInflowTracking()
        setClearance(0)
      }

      const existing = document.querySelector<HTMLElement>(source.selector)
      if (existing) attach(existing)

      const mutationObserver = new MutationObserver(() => {
        const el = document.querySelector<HTMLElement>(source.selector)
        if (el && !resizeObserver) attach(el)
        else if (!el && resizeObserver) detach()
      })
      mutationObserver.observe(document.body, { childList: true, subtree: true })

      cleanups.push(() => {
        mutationObserver.disconnect()
        resizeObserver?.disconnect()
        intersectionObserver?.disconnect()
        stopInflowTracking()
      })
    })

    return () => cleanups.forEach((fn) => fn())
    // Callers must pass a stable (module-level) `sources` array — it drives
    // effect setup/teardown, so a new identity every render would thrash
    // the observers.
  }, [sources])

  return React.useMemo(() => Math.max(0, ...Object.values(clearances)), [clearances])
}
