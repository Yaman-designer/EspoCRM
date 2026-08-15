'use client'

import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebarStore'
import { useFabAvoidance, type FabAvoidSource } from '@/hooks/useFabAvoidance'
import { BOTTOM_NAV_ITEMS } from './bottom-nav.config'
import { BottomNavItem } from './BottomNavItem'
import { BottomNavIndicator } from './BottomNavIndicator'

// A focused task flow (the property wizard's FormActionBar) owns the bottom
// of the screen while it's active — same "docked" contract BackToTopButton
// already avoids (see useFabAvoidance's own docs). The bar doesn't try to
// float above it like the FAB does; it steps aside entirely, the same way
// Stripe/Notion/Linear hide their tab chrome during a focused flow.
const FORM_BAR_SOURCE: FabAvoidSource[] = [
  { selector: '[data-slot="form-action-bar"]', mode: 'docked' },
]

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
}

/**
 * Mobile primary navigation — one floating capsule bar, md:hidden (desktop
 * keeps AppSidebar). 4 fixed peers; the header's own hamburger still opens
 * the full sidebar drawer independently, so removing overflow from this bar
 * loses no reachability, only the duplicate entry point.
 */
export function BottomNav() {
  const { t } = useTranslation('nav')
  const pathname = usePathname()
  const { mobileOpen } = useSidebarStore()
  const formBarClearance = useFabAvoidance(FORM_BAR_SOURCE)
  const hidden = mobileOpen || formBarClearance > 0

  const activeIndex = Math.max(0, BOTTOM_NAV_ITEMS.findIndex((item) => isActive(pathname, item.href)))

  return (
    <nav
      data-slot="bottom-nav"
      aria-label={t('primaryNavigation')}
      aria-hidden={hidden}
      className={cn(
        'fixed inset-x-3 z-40 md:hidden',
        // Safe-area-aware rest offset — same recipe as FloatingUtilityButton's
        // own bottom anchor, just a smaller base value since this bar sits
        // full-width rather than tucked into a single corner.
        'bottom-[calc(0.875rem+env(safe-area-inset-bottom))]',
        'transition-[opacity,transform] duration-(--duration-medium) ease-(--ease-premium)',
        hidden
          ? 'pointer-events-none translate-y-3 opacity-0'
          : 'pointer-events-auto translate-y-0 opacity-100',
        'motion-reduce:transition-none',
      )}
    >
      {/* Outer — the card's own chrome: border/surface/shadow/corner radius,
          plus the padding that separates the capsule's track from the
          card's edge. Deliberately carries zero layout/positioning logic of
          its own, so it can't drift out of sync with the inner track's
          coordinate space (see BottomNavIndicator's own note on why that
          split matters for pixel-exact alignment).
          shadow-design-xs (not -sm): one more notch down — the bar itself
          should all but disappear, its edge read from the border, not a
          shadow halo. --shadow-xs is the lightest tier this app defines
          (see globals.css's shadow scale); reused as-is, not a bespoke
          value. Border bumped 60→70 to compensate — now that the shadow
          barely contributes to the bar's silhouette, the border is what
          actually draws it, so it needs to hold that job on its own. */}
      <div
        className={cn(
          'rounded-3xl p-1.5',
          'border border-border/70 bg-card/90 backdrop-blur-md shadow-design-xs',
        )}
      >
        {/* Inner track — the capsule and the items share this exact box as
            their coordinate space (no padding of its own), which is what
            makes `translate3d(index * 100%, 0, 0)` land precisely on each
            item's own flex-1 slot. Not a second "card": no border, shadow,
            or background — purely structural. */}
        <div className="relative flex items-stretch">
          <BottomNavIndicator activeIndex={activeIndex} count={BOTTOM_NAV_ITEMS.length} />
          {BOTTOM_NAV_ITEMS.map((item, index) => (
            <BottomNavItem
              key={item.id}
              item={item}
              label={t(item.labelKey)}
              active={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
