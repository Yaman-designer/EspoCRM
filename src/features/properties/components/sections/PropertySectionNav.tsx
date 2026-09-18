'use client'

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator'
import type { SectionNavItem } from '../../view-models/detail-page.viewmodel'
export type { SectionNavItem }

// UI/UX Architecture Refinement (2026-07-24). The active-tab indicator was a
// static per-button `after:` pseudo-element that snapped instantly between
// buttons — the one piece of this nav's motion language that didn't match
// the rest of the app, which already shares one `useSlidingIndicator`
// primitive across every segmented control (Asset Management's Photos/
// Legal, Location Intelligence's category filter). Reused here rather than
// reinvented — same measurement mechanism, same transition tokens — but
// rendered as this nav's own already-established shape (a thin underline)
// rather than the filter bar's filled pill: the two contexts have carried
// deliberately different active-state shapes since this nav's very first
// pass, and unifying the *mechanism* doesn't require unifying the *shape*.
const TRIGGER_INDICATOR_ID = '__trigger__'

// Interaction Design Sprint 4 (2026-07-18). The Details page is a long,
// single scroll with 13+ sections — reaching Contacts or Timeline from the
// top previously cost a long, blind scroll with no orientation. This is a
// pure navigation affordance over the reading order Sprint 3 already
// decided; it does not reorder, merge, or add any section, and every id it
// points to already exists in PropertyDetailView's zone wrappers.
//
// Adaptive Navigation Architecture (2026-07-24). Replaces two prior passes
// (a hard-clip row, then a horizontally-scrolling row with edge-fade/snap)
// with a measured priority+overflow pattern — the same category of
// mechanism GitHub, Notion, and Atlassian use for exactly this problem.
// Full rationale in this file's own architecture note below the component.

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const GAP_PX = 2 // matches the visible row's `gap-0.5` (0.125rem = 2px)

/**
 * Pure, unit-testable fit computation. Given each item's real rendered
 * width (left-to-right, matching `items` order), the "More" trigger's own
 * width, the gap between elements, and the available container width:
 * returns how many leading items can be shown as pinned tabs before the
 * rest must move into the overflow menu.
 *
 * Two-pass, not a single greedy pass: first checks whether EVERY item fits
 * with no "More" trigger needed at all (the common desktop case — reserving
 * space for a trigger that ends up unused would under-fill the row for no
 * reason). Only once that fails does the second pass reserve space for the
 * trigger and find the real cutoff.
 */
export function computeVisibleCount(
  itemWidths: number[],
  moreWidth: number,
  gap: number,
  containerWidth: number,
): number {
  if (itemWidths.length === 0) return 0

  const totalWidth = itemWidths.reduce((sum, w) => sum + w, 0) + gap * (itemWidths.length - 1)
  if (totalWidth <= containerWidth) return itemWidths.length

  const budget = containerWidth - moreWidth - gap
  let used = 0
  let count = 0
  for (const w of itemWidths) {
    const next = used + (count > 0 ? gap : 0) + w
    if (next > budget) break
    used = next
    count++
  }
  return count
}

interface PropertySectionNavProps {
  items: SectionNavItem[]
}

export function PropertySectionNav({ items }: PropertySectionNavProps) {
  const { t } = useTranslation('properties')
  const [activeId, setActiveId]   = useState<string>(items[0]?.id ?? '')
  const [menuOpen, setMenuOpen]   = useState(false)
  // null = "not measured yet" (first paint, before layout) — renders every
  // item so there's real content to measure against, never a flash of an
  // empty bar. Real number thereafter, including `items.length` (every tab
  // fits, no trigger rendered at all).
  const [visibleCount, setVisibleCount] = useState<number | null>(null)
  const [isStuck, setIsStuck] = useState(false)

  const visibleRef  = useRef<Map<string, boolean>>(new Map())
  const containerRef = useRef<HTMLElement>(null)
  const measureRowRef = useRef<HTMLDivElement>(null)
  const measureMoreRef = useRef<HTMLButtonElement>(null)
  const rafRef = useRef<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Active-section tracking — unchanged from prior passes. Independent
  // of layout; drives both the pinned tabs' `aria-current` and, when the
  // active section has scrolled into the overflow menu, the trigger's own
  // label/active styling below. ──
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

  // ── "Stuck" tracking for the sticky shadow ───────────────────────────────
  // A 1px sentinel rendered immediately above the nav in normal flow: once
  // it scrolls past the header and out of view, the nav itself is genuinely
  // pinned (not just sticky-but-still-in-place), so this is when the shadow
  // should appear — same IntersectionObserver approach as active-section
  // tracking above, not a scroll listener.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: '-57px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // ── Width measurement + fit computation ─────────────────────────────────
  // A second, identical row of buttons renders off-screen (visibility:
  // hidden, not display:none — hidden elements still lay out and report
  // real offsetWidth, none elements report 0) purely so the browser tells
  // us each item's true rendered width — font, padding, and label text all
  // affect this, so a hardcoded estimate would drift the moment a label or
  // font changes. Recomputed on container resize (ResizeObserver) and
  // whenever `items` changes (the Contacts tab's own conditional presence).
  const recompute = useCallback(() => {
    const container = containerRef.current
    const row = measureRowRef.current
    const moreBtn = measureMoreRef.current
    if (!container || !row || !moreBtn) return

    const itemWidths = Array.from(row.children).map(el => (el as HTMLElement).offsetWidth)
    const moreWidth = moreBtn.offsetWidth
    const containerWidth = container.clientWidth

    setVisibleCount(computeVisibleCount(itemWidths, moreWidth, GAP_PX, containerWidth))
  }, [])

  // rAF-coalesced: a ResizeObserver can fire many times during a single
  // continuous drag-resize; scheduling at most one pending recompute per
  // frame (cancelling any not-yet-run one) avoids the layout-thrashing a
  // synchronous read-on-every-callback would cause, while still tracking
  // the live width with no perceptible lag (unlike a setTimeout debounce,
  // which would visibly lag behind the cursor during the resize itself).
  const scheduleRecompute = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      recompute()
    })
  }, [recompute])

  useLayoutEffect(() => {
    recompute()
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(scheduleRecompute)
    observer.observe(container)
    return () => {
      observer.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [items, recompute, scheduleRecompute])

  function goTo(id: string) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  // Render every item as a pinned tab until real measurements land — a
  // one-frame "show everything" state is a far safer default than "show
  // nothing," and it's what the measurement pass itself needs anyway.
  const effectiveVisibleCount = visibleCount ?? items.length
  const pinnedItems   = items.slice(0, effectiveVisibleCount)
  const overflowItems = items.slice(effectiveVisibleCount)
  const hasOverflow    = overflowItems.length > 0
  const activeInOverflow = hasOverflow && overflowItems.some(i => i.id === activeId)
  const activeOverflowItem = activeInOverflow ? overflowItems.find(i => i.id === activeId) : undefined

  const indicatorItemIds = hasOverflow
    ? [...pinnedItems.map(i => i.id), TRIGGER_INDICATOR_ID]
    : pinnedItems.map(i => i.id)
  const indicatorActiveId = activeInOverflow ? TRIGGER_INDICATOR_ID : activeId
  const { containerRef: indicatorRowRef, registerItem: registerIndicatorItem, rect: indicatorRect } =
    useSlidingIndicator<HTMLDivElement>(indicatorActiveId, indicatorItemIds)

  return (
    <>
    {/* Sentinel for the "stuck" shadow — see the IntersectionObserver effect
        above. Zero-height, purely a scroll-position marker. Hidden together
        with the nav below (md:hidden) — kept as a sibling of the shared
        nav+grid wrapper in PropertyDetailView.tsx rather than wrapped in a
        new div there, which would give the nav a too-short containing block
        again (see that file's own sticky-nav-fix note) and, once hidden via
        CSS only, still leave a live IntersectionObserver target with no
        visual purpose above `md`. */}
    <div ref={sentinelRef} aria-hidden="true" className="h-px md:hidden" />
    <nav
      ref={containerRef}
      aria-label={t('nav.sectionNavigation')}
      className={cn(
        // Mobile-only pass (2026-08-08). Section nav is a mobile affordance
        // — tablet/desktop show every section inline on one continuous
        // scroll, so a same-page jump menu is redundant there (confirmed:
        // this was an explicit, deliberate product decision, not a gap).
        // `md:hidden` (this app's own established mobile-only breakpoint —
        // BottomNav.tsx uses the identical convention) removes the nav from
        // rendering entirely at `md`+, so it also takes zero layout space:
        // content below flows up into it with no gap, no JS viewport
        // detection involved.
        'md:hidden',
        'relative z-30 -mx-4 flex items-center gap-0.5 overflow-hidden px-4 py-2.5',
        'sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-7 lg:px-7 xl:-mx-8 xl:px-8',
        // sticky at every breakpoint, not just lg+ — 56px matches the real
        // app header's own height (TopNavbar in
        // src/components/dashboard/navbar/index.tsx is `h-14`, not the
        // unused DashboardHeader.tsx component); keep these two in sync if
        // that header height ever changes.
        'sticky top-14',
        // Floating-layer polish (2026-08-07). Depth is introduced only once
        // the nav is genuinely pinned (isStuck, from the sentinel above),
        // not as a permanent fixture — at rest, `bg-background` alone is
        // visually identical to the page behind it (same token), so the bar
        // reads as flat/attached; only once content is actually scrolling
        // beneath it does it separate into a distinct, lightweight surface.
        // border-color/background-color/box-shadow are cheap paint
        // properties, so they're the ones that transition smoothly
        // (duration/easing match this app's own hover-transition tokens,
        // not an invented curve); `backdrop-blur-sm` itself is toggled as a
        // hard class swap rather than animated — animating `filter` is
        // genuinely expensive, and there's nothing to blur before the nav
        // is actually stuck (no content sits under it yet), so there's
        // nothing lost by not easing it in.
        'bg-background border-b border-transparent',
        'transition-[background-color,border-color,box-shadow] duration-(--duration-standard) ease-(--ease-premium)',
        // Desktop surface pass (2026-08-08). Below `lg` (small screens
        // benefit from the visual separation), pinning still introduces the
        // floating-card surface exactly as before — `max-lg:` scopes every
        // class in this group to media (max-width: 1023.98px), so none of
        // them emit any rule active at `lg`+ in the first place. That's
        // deliberate, not equivalent to applying them unconditionally and
        // trying to cancel them with a later `lg:` override, which was the
        // first thing tried here and confirmed live NOT to work: a plain
        // `shadow-design-sm` (this app's hand-authored `@layer utilities`
        // class in globals.css, not a Tailwind `@utility`) can't have a
        // `max-lg:`/`lg:` variant generated for it at all — Tailwind's JIT
        // only generates variants for utilities it recognizes, and a raw
        // hand-written CSS class isn't one, so `max-lg:shadow-design-sm`
        // silently produced no CSS rule and the shadow vanished everywhere,
        // not just at `lg`+. `shadow-(--shadow-sm)` is Tailwind's own
        // CSS-variable-shorthand syntax instead — fully variant-aware —
        // pointed at the exact same `--shadow-sm` custom property
        // `shadow-design-sm` itself reads, so it's still the one design
        // token, not a duplicated literal box-shadow value.
        isStuck && 'max-lg:bg-background/92 max-lg:backdrop-blur-sm max-lg:border-border/40 max-lg:shadow-(--shadow-sm)',
        // `lg`+: the nav integrates into the page instead of floating over
        // it — no surface, no blur, no shadow (nothing above sets them at
        // this width once isStuck's classes are max-lg-scoped, so there's
        // nothing to override), just a hairline divider faint enough to
        // read as part of the page rather than a card edge.
        'lg:bg-transparent lg:border-border/15',
      )}
    >
      <div ref={indicatorRowRef} className="relative flex items-center gap-0.5">
        {/* Shared sliding-indicator primitive (see the import's own note) —
            a single underline that glides via `transform`/`width` to
            whichever element is active, instead of the underline just
            appearing on a newly-active button. Inset 14px each side
            (matches the buttons' own `px-3.5`) so it tracks each label's
            actual text width, not the button's padded hit-box. */}
        {indicatorRect && (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute -bottom-px h-0.5 rounded-full bg-primary',
              'transition-[transform,width] duration-(--duration-large) ease-(--ease-spring)',
              'motion-reduce:transition-none',
            )}
            style={{
              transform: `translateX(${indicatorRect.x + 14}px)`,
              width: Math.max(0, indicatorRect.width - 28),
            }}
          />
        )}

        {pinnedItems.map(item => (
          <NavTabButton
            key={item.id}
            ref={registerIndicatorItem(item.id)}
            item={item}
            active={item.id === activeId}
            onClick={() => goTo(item.id)}
          />
        ))}

        {hasOverflow && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                ref={registerIndicatorItem(TRIGGER_INDICATOR_ID)}
                type="button"
                aria-label={activeOverflowItem ? t('nav.sectionMenu', { label: activeOverflowItem.label }) : t('nav.moreSections')}
                className={cn(
                  'relative shrink-0 flex items-center gap-1 rounded-md px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide',
                  'transition-colors duration-(--duration-medium) ease-(--ease-premium)',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  activeInOverflow
                    ? 'text-foreground'
                    : 'text-muted-foreground/45 hover:bg-muted/25 hover:text-foreground/80',
                  // Discoverability: a quiet tint whenever the menu holds the
                  // active section, even before it's opened — the trigger
                  // shouldn't look identical to an inert "nothing new here"
                  // control when it's actually the thing telling the reader
                  // where they are.
                  activeInOverflow && !menuOpen && 'bg-primary/6',
                )}
              >
                {activeOverflowItem?.label ?? t('nav.more')}
                <ChevronDown className={cn('size-3 transition-transform duration-200 ease-(--ease-spring)', menuOpen && 'rotate-180')} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40 w-auto">
              {overflowItems.map(item => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => goTo(item.id)}
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wide py-1.5',
                    item.id === activeId ? 'text-foreground bg-accent/60' : 'text-muted-foreground/70',
                  )}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Hidden measurement layer ──────────────────────────────────────
          `invisible` (not `hidden`/`display:none`): still participates in
          layout and reports real offsetWidth, just paints nothing and
          intercepts no pointer/keyboard events, so it's inert to both
          mouse users and screen readers (`aria-hidden`, belt-and-braces).
          `absolute` + `pointer-events-none` keeps it from affecting the
          visible row's own box or being tab-reachable. Every button here
          shares the exact className of a real pinned tab (font/padding
          drive width) — a hand-maintained width table would silently drift
          the moment a label, font, or padding scale changes; this can't. */}
      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex items-center gap-0.5"
      >
        <div ref={measureRowRef} className="flex items-center gap-0.5">
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              tabIndex={-1}
              className="relative shrink-0 rounded-md px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          ref={measureMoreRef}
          type="button"
          tabIndex={-1}
          className="relative shrink-0 flex items-center gap-1 rounded-md px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
        >
          {/* Widest realistic trigger label — an active item's own name can
              be longer than the literal word "More"; measuring against the
              longest pinned label (a safe, real upper bound already present
              in `items`, not an invented one) prevents the fit computation
              from being calibrated against a shorter trigger than could
              actually appear once a long-labelled section becomes active. */}
          {items.reduce((longest, i) => i.label.length > longest.length ? i.label : longest, t('nav.more'))}
          <ChevronDown className="size-3" />
        </button>
      </div>
    </nav>
    </>
  )
}

const NavTabButton = forwardRef<HTMLButtonElement, { item: SectionNavItem; active: boolean; onClick: () => void }>(
  function NavTabButton({ item, active, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'relative shrink-0 rounded-md px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide',
          'transition-colors duration-(--duration-medium) ease-(--ease-premium)',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          active
            ? 'text-foreground'
            : 'text-muted-foreground/45 hover:bg-muted/25 hover:text-foreground/80',
        )}
      >
        {item.label}
      </button>
    )
  },
)

// ── Architecture note ────────────────────────────────────────────────────
// Enterprise Responsive Navigation Refactor (2026-07-24). Full rewrite, not
// a patch — see git history for the two prior passes this replaces (a
// hard-clip row, then a horizontally-scrolling row with edge-fade/snap/
// auto-scroll). Why this is a different category of solution, not a bigger
// version of the same one:
//
// WHAT CHANGED
//  - The nav no longer scrolls, ever. Every width from 1920px down to a
//    280px foldable resolves to one of two states: every tab pinned and
//    visible (desktop/laptop — the common case), or the leading N tabs
//    pinned + the rest behind an accessible "More ▼" trigger (everything
//    narrower). There is no state where a tab exists but requires the user
//    to scroll, swipe, or hunt to find it.
//  - N is not a breakpoint. It's computed from three real, measured
//    numbers every time available width changes: each tab's real rendered
//    width (via an invisible measurement clone, not an estimate), the
//    trigger's own width, and the container's actual clientWidth. A label
//    getting longer, a font change, a sidebar changing the available
//    column width — all of these self-correct with no code change, which
//    a `hidden md:block` breakpoint table never would.
//  - The active section is never orphaned. If it's one of the pinned
//    tabs, it gets the same underline treatment as before. If the
//    algorithm has pushed it into overflow, the trigger itself adopts the
//    active section's own name and the active underline — "Timeline ▼"
//    — so the single most important piece of orientation on this page
//    (where am I) is never hidden behind a generic "More."
//
// WHY THIS IS THE RIGHT DEFAULT FOR THIS CASE (not a scroll fallback)
//  - This is 7 independent same-page anchors, not a fixed 4-5 item primary
//    IA — a real Land-category listing conditionally adds Contacts, and
//    another few fields (5-6 typical) is a realistic future count. A
//    scrolling strip degrades linearly as more items are added (more
//    hunting); a measured overflow menu degrades by moving items into a
//    list that's already the correct pattern for "more items than fit."
//  - No dedicated "mobile" component or breakpoint fork exists. At 280px
//    the exact same algorithm that shows all 7 tabs at 1920px naturally
//    converges to "1-2 pinned tabs + a trigger showing the active
//    section's name" — which is functionally the sticky single-selector
//    pattern (Option A in the brief) the brief asked for, arrived at as a
//    consequence of one continuous rule rather than a second, parallel
//    implementation to keep in sync with the first.
//
// DESIGN SYSTEM — deliberately unchanged
//  - Tab typography, color tokens, active-state underline, focus ring,
//    hover treatment, and the page's own responsive gutter scale
//    (px-4 sm:5 md:6 lg:7 xl:8) are byte-for-byte the same classes the
//    prior pass established. The only new visual surface is the dropdown
//    panel itself, which reuses this repo's own existing `DropdownMenu`
//    primitive (already used elsewhere in this app) rather than
//    introducing a new menu implementation or visual language.
//
// ACCESSIBILITY
//  - The pinned tabs are plain buttons in natural Tab order with
//    `aria-current="true"` on the active one — correct per the WAI-ARIA
//    APG for same-page navigation links (this is not a `tablist`/`tab`
//    widget: there's no associated panel being shown/hidden, so importing
//    tablist's roving-tabindex/arrow-key semantics here would be
//    incorrect ARIA, not an accessibility improvement).
//  - The overflow trigger and menu ARE a real ARIA menu widget, so they
//    use Radix's `DropdownMenu` rather than a hand-rolled listbox — arrow
//    key navigation, Home/End, typeahead, Escape-to-close,
//    focus-return-to-trigger, and `role="menu"`/`role="menuitem"` all come
//    from a primitive this app already ships and already trusts elsewhere,
//    not reimplemented here with its own edge cases.
//
// PERFORMANCE
//  - Exactly one `ResizeObserver`, observing exactly one element (the nav
//    container). Its callback is rAF-coalesced (`scheduleRecompute`): a
//    continuous drag-resize firing the observer dozens of times per second
//    collapses to at most one measurement + one state update per animation
//    frame, never a synchronous read on every single callback.
//  - The state write it produces (`visibleCount`) only actually changes,
//    and only actually re-renders the visible row, when the computed
//    cutoff differs from the last one — resizing within a range where the
//    same N tabs still fit produces zero additional renders.
