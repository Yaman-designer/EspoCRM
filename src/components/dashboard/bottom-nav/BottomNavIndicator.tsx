'use client'

import { cn } from '@/lib/utils'

interface BottomNavIndicatorProps {
  activeIndex: number
  count: number
}

/**
 * The one moving piece of the bar — two nested spans with a deliberate split
 * of concerns:
 *
 * OUTER span — pure position math, no visual styling. Its width is exactly
 * `100/count`% and it moves via `translate3d(index * 100%, 0, 0)`. Percentage
 * translate resolves against the element's OWN box per the CSS transform
 * spec, and since that box is exactly one slot wide, `translate3d(100%,…)`
 * moves it by exactly one slot — no measured pixel, no fudge constant, no
 * rounding drift across slots. This is what makes the capsule land pixel-
 * exact on every item's own flex-1 box (same track, no separate coordinate
 * space) instead of "approximately near it."
 *
 * INNER span — the visual skin, inset a few fixed px from the outer box so
 * the capsule reads as a floating pill rather than a hard-edged block
 * touching its neighbors. Safe to inset with plain px here specifically
 * *because* it's applied after the outer box is already exact — nothing
 * about the inset feeds back into the position math the way the old
 * `calc(width - 3px)` / `calc(translate + 2px)` version did.
 *
 * The inset is deliberately asymmetric, not a single uniform value: more
 * horizontal inset (6px/side) than vertical (4px/side). Horizontal is what
 * governs the capsule's width against its slot — 6px/side lands it at
 * roughly 86-88% of the slot at typical phone widths, leaving genuine
 * negative space on either side instead of a pill that nearly touches its
 * neighbors. Vertical stays tighter so the capsule still fills the row's
 * height with confidence — a pill that's narrow AND short reads as
 * shrunken, not refined.
 *
 * Only `transform` (on the outer span) ever animates — GPU-composited,
 * immune to label length or locale, and with a fixed 4-item count there's
 * no layout read involved at all. It runs on --ease-glide rather than
 * --ease-spring: a continuous, physically-connected glide from slot to
 * slot reads calmer than a spring's tiny "give" on arrival — see the
 * token's own definition in globals.css for why it's a separate curve
 * rather than retuning --ease-spring itself (that curve is still exactly
 * right for FeedbackState's mount pop elsewhere).
 */
export function BottomNavIndicator({ activeIndex, count }: BottomNavIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 inset-s-0',
        'transition-transform duration-(--duration-large) ease-(--ease-glide) will-change-transform',
        'motion-reduce:transition-none',
        'rtl:[--bn-dir:-1]',
      )}
      style={{
        width: `${100 / count}%`,
        transform: `translate3d(calc(var(--bn-dir, 1) * ${activeIndex} * 100%), 0, 0)`,
      }}
    >
      {/* Visual skin — reuses AppSidebar's own active-row recipe (tinted
          primary surface + inset ring) as its base, so the mobile capsule and
          desktop sidebar's active state share one language. The paired inset
          highlight (light catch on top, a hair of depth on the bottom edge)
          is that same logo tile's own two-inset recipe, just softened for a
          much larger, flatter surface — a light source, not a bevel.
          `key`'d on activeIndex so `.bn-capsule-settle` (globals.css) restarts
          on every tab switch: a fresh node is what makes a CSS *animation*
          (unlike a transition) run again from 0%, no state needed for it.
          "Embedded in the track, not floating on it": bn-capsule-settle's
          own box-shadow no longer includes a primary-tinted drop shadow
          (see its comment in globals.css) — that outward, colored shadow
          was the strongest cue reading this as a chip placed on top rather
          than a surface belonging to the bar. With that gone, `ring-inset`
          — already drawn *inside* the box, never projecting outward — is
          what actually tells the eye "this slot is selected," so it took a
          notch more presence (10→12) to still read clearly at a glance now
          that it's carrying more of that job alone. Fill stays at /8: still
          the lightest tint that's legibly "on", not louder just because the
          shadow got quieter. */}
      <span
        key={activeIndex}
        className={cn(
          'absolute inset-y-1 inset-x-1.5 rounded-2xl bn-capsule-settle',
          'bg-primary/8 ring-1 ring-inset ring-primary/12',
        )}
      />
    </span>
  )
}
