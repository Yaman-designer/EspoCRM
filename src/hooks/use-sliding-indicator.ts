import { useLayoutEffect, useRef, useState } from 'react'

export interface SlidingIndicatorRect {
  x: number
  y: number
  width: number
  height: number
}

// Enterprise Motion Design pass (2026-07-24). Shared by every segmented
// control / roving-tablist in the app (Asset Management's Photos/Legal,
// Location Intelligence's Education/Medical/Transit/Walk) so the active-item
// indicator glides via CSS transform instead of the active background just
// appearing on the newly-selected button — one measurement implementation
// instead of one copy per segmented control, same spirit as the shared
// `handleRovingTabListKeyDown` those same two components already use.
export function useSlidingIndicator<TContainer extends HTMLElement = HTMLElement>(activeId: string, itemIds: string[]) {
  const containerRef = useRef<TContainer | null>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [rect, setRect] = useState<SlidingIndicatorRect | null>(null)

  function registerItem(id: string) {
    return (el: HTMLElement | null) => {
      if (el) itemRefs.current.set(id, el)
      else itemRefs.current.delete(id)
    }
  }

  const itemIdsKey = itemIds.join('|')

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current
      const item = itemRefs.current.get(activeId)
      if (!container || !item) return
      const containerRect = container.getBoundingClientRect()
      const itemRect = item.getBoundingClientRect()
      setRect({
        x: itemRect.left - containerRect.left,
        y: itemRect.top - containerRect.top,
        width: itemRect.width,
        height: itemRect.height,
      })
    }
    measure()
    // Label widths can shift (e.g. locale, count digits) — re-measure on resize.
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeId, itemIdsKey])

  return { containerRef, registerItem, rect }
}
