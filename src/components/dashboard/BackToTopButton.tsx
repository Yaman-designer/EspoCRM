'use client'

import * as React from 'react'
import { ArrowUp } from 'lucide-react'
import { FloatingUtilityButton } from '@/components/ui/floating-utility-button'

/**
 * Hysteresis thresholds (px of window.scrollY) — asymmetric on purpose so
 * the button doesn't flicker in/out while the user scrolls back and forth
 * near a single value.
 */
const SHOW_AT = 400
const HIDE_AT = 250

/** Matches FormActionBar's data-slot (src/components/form-framework/FormActionBar.tsx). */
const ACTION_BAR_SELECTOR = '[data-slot="form-action-bar"]'

export function BackToTopButton() {
  const [visible, setVisible] = React.useState(false)
  const [actionBarHeight, setActionBarHeight] = React.useState(0)

  React.useEffect(() => {
    let ticking = false
    const evaluate = () => {
      ticking = false
      const y = window.scrollY
      setVisible((prev) => {
        if (y >= SHOW_AT) return true
        if (y <= HIDE_AT) return false
        return prev
      })
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(evaluate)
    }
    evaluate()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /*
   * FormActionBar mounts/unmounts as the user navigates between routes
   * (App Router keeps this layout alive, only the routed page swaps), so a
   * one-time querySelector on mount would miss it appearing later. Watch
   * the DOM instead and (re)attach a ResizeObserver whenever it shows up,
   * so the button always clears it without either component knowing about
   * the other.
   */
  React.useEffect(() => {
    let resizeObserver: ResizeObserver | null = null

    const attach = (el: HTMLElement) => {
      // el.offsetHeight, not entry.contentRect.height: contentRect is the
      // content box only and excludes the bar's own padding — which is
      // exactly its resting bottom gutter, the clearance this button needs
      // to clear. Using contentRect under-measured the bar by that amount
      // and let this button overlap it at wider viewports.
      resizeObserver = new ResizeObserver(() => setActionBarHeight(el.offsetHeight))
      resizeObserver.observe(el)
    }
    const detach = () => {
      resizeObserver?.disconnect()
      resizeObserver = null
      setActionBarHeight(0)
    }

    const existing = document.querySelector<HTMLElement>(ACTION_BAR_SELECTOR)
    if (existing) attach(existing)

    const mutationObserver = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(ACTION_BAR_SELECTOR)
      if (el && !resizeObserver) attach(el)
      else if (!el && resizeObserver) detach()
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      resizeObserver?.disconnect()
    }
  }, [])

  const handleClick = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <FloatingUtilityButton
      icon={<ArrowUp strokeWidth={2.25} aria-hidden />}
      visible={visible}
      bottomInset={actionBarHeight}
      onClick={handleClick}
      aria-label="Back to top"
    />
  )
}
