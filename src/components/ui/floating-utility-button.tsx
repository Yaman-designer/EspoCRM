'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FloatingUtilityButtonProps
  extends Omit<React.ComponentProps<'button'>, 'children'> {
  /** Icon-only content — sized by the button, do not pass a pre-sized SVG. */
  icon: React.ReactNode
  /** Controls the fade + lift in/out. Stays mounted (and inert) when false, so layout never shifts. */
  visible?: boolean
  /**
   * Extra clearance above the button's resting bottom offset, in px.
   * Lets a page-level sticky element (e.g. FormActionBar) push the button up
   * so it never overlaps — see BackToTopButton for the live measurement.
   */
  bottomInset?: number
}

/**
 * Base primitive for the app's floating action affordances (Back to Top,
 * future Scroll to Bottom / Quick Actions variants). Owns position, surface,
 * motion and a11y — variants only ever swap the icon and onClick.
 */
const FloatingUtilityButton = React.forwardRef<HTMLButtonElement, FloatingUtilityButtonProps>(
  ({ icon, visible = true, bottomInset = 0, className, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-slot="floating-utility-button"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        style={{ ['--fab-extra-bottom' as string]: `${bottomInset}px`, ...style }}
        className={cn(
          'fixed z-40',
          'right-4 sm:right-6',
          // This offset is what actually separates the button from the bar:
          // bottomInset carries the bar's own *measured* height (see
          // BackToTopButton's ResizeObserver), so it exactly cancels the
          // bar out of the equation — whatever is added on top of it here
          // is the real, literal clearance between the button's bottom edge
          // and the bar's top edge, on every device/viewport/bar-height
          // combination without hardcoding any of those. 1.5rem (24px) is
          // the floor of the enterprise floating-action clearance band
          // (Stripe/Linear/Notion/Vercel sit in the 24-32px range); it was
          // previously 1rem (16px), which read as glued to the bar.
          'bottom-[calc(1.5rem+env(safe-area-inset-bottom)+var(--fab-extra-bottom,0px))]',
          // 2rem (32px) at rest on wider viewports — the ceiling of that
          // same band — for the more generous clearance premium products
          // use once there's room for it. Was 1.25rem (20px).
          'sm:bottom-[calc(2rem+var(--fab-extra-bottom,0px))]',
          'flex size-11 sm:size-12 items-center justify-center rounded-full',
          'bg-card border border-border/70 text-muted-foreground',
          'shadow-design-sm hover:shadow-design-md hover:-translate-y-px hover:text-primary',
          'active:scale-[0.98]',
          'outline-none focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:border-ring/60',
          'transition-[opacity,transform,box-shadow,color,bottom] ease-(--ease-premium)',
          visible
            ? 'pointer-events-auto translate-y-0 opacity-100 duration-(--duration-medium)'
            : 'pointer-events-none translate-y-2 opacity-0 duration-(--duration-fast)',
          'motion-reduce:transition-none',
          '[&_svg]:size-[18px] [&_svg]:shrink-0',
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    )
  },
)
FloatingUtilityButton.displayName = 'FloatingUtilityButton'

export { FloatingUtilityButton }
