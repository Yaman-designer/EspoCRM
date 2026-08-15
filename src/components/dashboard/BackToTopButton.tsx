'use client'

import * as React from 'react'
import { ArrowUp } from 'lucide-react'
import { FloatingUtilityButton } from '@/components/ui/floating-utility-button'
import { useFabAvoidance, type FabAvoidSource } from '@/hooks/useFabAvoidance'

/**
 * Hysteresis thresholds (px of window.scrollY) — asymmetric on purpose so
 * the button doesn't flicker in/out while the user scrolls back and forth
 * near a single value.
 */
const SHOW_AT = 400
const HIDE_AT = 250

/**
 * Every bottom-anchored control this FAB must never cover registers here —
 * add a data-slot to a new one and list it below, no other changes needed.
 * 'docked' sources (sticky bars, e.g. FormActionBar) always reserve their
 * full height. 'inflow' sources (footers that scroll with the page, e.g.
 * pagination) only reserve height while actually on screen — see
 * useFabAvoidance for why that distinction matters.
 */
const AVOID_SOURCES: FabAvoidSource[] = [
  { selector: '[data-slot="form-action-bar"]', mode: 'docked' },
  { selector: '[data-slot="pagination-footer"]', mode: 'inflow' },
  { selector: '[data-slot="bottom-nav"]', mode: 'docked' },
]

export function BackToTopButton() {
  const [visible, setVisible] = React.useState(false)
  const bottomInset = useFabAvoidance(AVOID_SOURCES)

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

  const handleClick = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <FloatingUtilityButton
      icon={<ArrowUp strokeWidth={2.25} aria-hidden />}
      visible={visible}
      bottomInset={bottomInset}
      onClick={handleClick}
      aria-label="Back to top"
    />
  )
}
