'use client'

import { forwardRef, memo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { BottomNavItemConfig } from './bottom-nav.types'

interface BottomNavItemProps {
  item: BottomNavItemConfig
  label: string
  active: boolean
}

/**
 * One tab. Touch-first, deliberately no `hover:` anywhere — this bar only
 * ever renders on mobile (BottomNav.tsx: `md:hidden`), so a pointer hover
 * state is dead weight at best and, on touch browsers that synthesize a
 * hover on tap, a flicker at worst. The only non-static feedback is
 * `active:` (press) — a quick scale + faint tint, released the instant the
 * finger lifts.
 *
 * `py-2.5` is what actually sets the bar's height — no hardcoded row height
 * lives anywhere in this component tree; the card wraps whatever height
 * these 4 identical items naturally need, so a future label/icon-size
 * change can't silently clip or float inside a stale fixed height.
 *
 * memo()'d because only one item's `active` flips per tab switch — without
 * this, all 4 re-render on every route change for the 3 that didn't
 * actually change anything.
 */
export const BottomNavItem = memo(
  forwardRef<HTMLAnchorElement, BottomNavItemProps>(function BottomNavItem({ item, label, active }, ref) {
    const Icon = item.icon

    return (
      <Link
        ref={ref}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative z-10 flex flex-1 flex-col items-center justify-center gap-1 py-2.5',
          'select-none outline-none rounded-2xl',
          'active:scale-[0.96] active:bg-foreground/3',
          'transition-transform duration-(--duration-fast) ease-(--ease-premium)',
          'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
          'motion-reduce:transition-none motion-reduce:active:scale-100',
        )}
      >
        {/* Arrival is staggered from departure on purpose: the outgoing item
            lets go immediately (no delay) while the incoming one settles in
            ~60ms after the capsule starts arriving underneath it — reads as
            the capsule causing the emphasis, not both flipping in lockstep.
            translate-y (not scale) is the "gains weight" cue, matched by a
            touch more stroke-width on the icon — no bounce, no scaling.
            Active/inactive hierarchy is luminance-only, one lever: full
            `text-muted-foreground` (not a diluted `/NN` shade of it) at a
            single opacity-65, not that color's own alpha stacked with a
            second element-level opacity on top. Two multiplied dilutions
            made the actual rendered weight hard to reason about; one clean
            65% (mid-point of the 60-70% target) reads as a deliberate step
            down from the active item's 100%, not an accident of two numbers
            compounding. */}
        <Icon
          className={cn(
            'size-5.5 shrink-0 transition-[color,stroke-width,transform,opacity] duration-(--duration-medium) ease-(--ease-premium)',
            active
              ? 'text-primary stroke-2 -translate-y-px opacity-100 delay-[60ms]'
              : 'text-muted-foreground stroke-[1.6] translate-y-0 opacity-65',
          )}
        />
        <span
          className={cn(
            'text-[10px] leading-none tracking-[-0.01em] transition-[color,transform,opacity] duration-(--duration-medium) ease-(--ease-premium)',
            active
              ? 'font-semibold text-primary -translate-y-px opacity-100 delay-[60ms]'
              : 'font-medium text-muted-foreground translate-y-0 opacity-65',
          )}
        >
          {label}
        </span>
      </Link>
    )
  }),
)
BottomNavItem.displayName = 'BottomNavItem'
