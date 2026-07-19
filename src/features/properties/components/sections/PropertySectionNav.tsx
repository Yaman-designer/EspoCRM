'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Interaction Design Sprint 4 (2026-07-18). The Details page is a long,
// single scroll with 13+ sections — reaching Contacts or Timeline from the
// top previously cost a long, blind scroll with no orientation. This is a
// pure navigation affordance over the reading order Sprint 3 already
// decided; it does not reorder, merge, or add any section, and every id it
// points to already exists in PropertyDetailView's zone wrappers.
//
// Nav header polish pass (2026-07-18). Removed the permanent "Top" control —
// a page-scoped scroll-to-top belongs on a scroll-triggered floating button,
// not a static header slot fighting the tabs for space. The tab list now
// simply left-aligns; a quiet trailing gap on a tab bar is standard (Linear,
// Vercel, GitHub all do this), not an imbalance to fill.

export interface SectionNavItem {
  id:    string
  label: string
}

interface PropertySectionNavProps {
  items: SectionNavItem[]
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function PropertySectionNav({ items }: PropertySectionNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')
  const visibleRef = useRef<Map<string, boolean>>(new Map())

  useEffect(() => {
    const elements = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          visibleRef.current.set(entry.target.id, entry.isIntersecting)
        }
        const nextActive = items.find(item => visibleRef.current.get(item.id))
        if (nextActive) setActiveId(nextActive.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <nav
      aria-label="Section navigation"
      className={cn(
        'z-30 -mx-6 flex items-center gap-0.5 overflow-x-auto no-scrollbar px-6 py-3',
        'border-b border-border/40 bg-background/85 backdrop-blur-md',
        'lg:sticky lg:top-16',
      )}
    >
      {items.map(item => {
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(item.id)}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'relative shrink-0 rounded-md px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide',
              'transition-all duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? "text-foreground after:absolute after:content-[''] after:inset-x-3.5 after:-bottom-px after:h-[1.5px] after:rounded-full after:bg-primary"
                : 'text-muted-foreground/50 hover:bg-muted/25 hover:text-foreground/80',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
