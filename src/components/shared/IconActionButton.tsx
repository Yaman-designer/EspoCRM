'use client'

import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

type IconType = ComponentType<{ className?: string }> | ComponentType<SVGProps<SVGSVGElement>>

interface IconActionButtonProps {
  icon: IconType
  label: string
  onClick: () => void
  /** 'sm' (36px) — every ghost icon action on a light card surface, and any
   *  icon action sitting on a photo corner (Favorite). 'lg' (48×44px) —
   *  the one deliberately larger tier, reserved for an icon action that sits
   *  directly beside a Primary CTA in the same row (PropertyCard's mobile
   *  footer Edit/Delete next to the h-12 "View Property" button) so it reads
   *  as touch-comparable in that specific context. Not a free choice per
   *  call site — see Button System report for why there are exactly two. */
  size?: 'sm' | 'lg'
  /** 'card' — sits on the card body / a light surface, dark icon, soft
   *  hover/press fill. 'glass' — sits over a photo, needs its own contrast
   *  (translucent dark backing, white icon, white focus ring) — a photo
   *  overlay can't use the card surface's tokens and still be legible. */
  surface?: 'card' | 'glass'
  tone?: 'default' | 'destructive'
  /** Toggled/"on" state — e.g. Favorite when favorited. Swaps to a filled
   *  rose treatment on either surface. */
  active?: boolean
  className?: string
  /** Extra classes applied to the icon only — e.g. a responsive size override
   *  (`'size-4 sm:size-3.5'`) where a call site's icon shrinks alongside its
   *  own breakpoint-driven button-size change. */
  iconClassName?: string
}

// Button System — Variant 3 (Icon Action). The ONE component for every
// icon-only record action across the Property Details experience — Edit,
// Delete, Favorite today; Share/Download if either is ever added. Before
// this, PropertyCard.tsx alone had three independent implementations for the
// same idea (a local `QuickAction` helper used only by PropertyListRow, plus
// separate hand-rolled Edit/Delete/Favorite buttons in the grid card, at two
// different desktop sizes — 32px and 36px — for what is conceptually the
// same "ghost icon action" control). This collapses all of it to one
// component with exactly two documented size tiers and two documented
// surface tiers (see prop docs) instead of N ad-hoc ones.
//
// Motion/focus on the 'card' surface matches Button/SecondaryButton's
// duration-250 ease-in-out + ring-4 ring-ring/20 — same interaction
// language as Variant 1/2. The 'glass' surface keeps its own white focus
// ring and slightly tighter active:scale-90 — both pre-existing, deliberate
// exceptions: a blue ring is invisible over a photo, and a small control
// floating over high-contrast imagery reads better with a slightly firmer
// press than a same-size control on a flat card surface.
export function IconActionButton({
  icon: Icon,
  label,
  onClick,
  size = 'sm',
  surface = 'card',
  tone = 'default',
  active = false,
  className,
  iconClassName,
}: IconActionButtonProps) {
  const sizeClasses = size === 'lg'
    ? 'h-12 w-11 rounded-2xl'
    : 'h-9 w-9 rounded-full'

  const iconSizeClasses = cn(size === 'lg' ? 'size-4' : 'size-3.5', iconClassName)

  if (surface === 'glass') {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          'flex items-center justify-center shrink-0 transition-colors duration-150',
          sizeClasses,
          'active:scale-90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          active
            ? 'bg-rose-500 text-white'
            : 'border border-white/18 bg-black/55 text-white hover:bg-black/70',
          'motion-reduce:transition-none motion-reduce:active:scale-100',
          className,
        )}
      >
        <Icon className={cn(iconSizeClasses, active && 'fill-current', 'transition-colors duration-150')} />
      </button>
    )
  }

  const destructive = tone === 'destructive'

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center shrink-0 transition-colors duration-150',
        sizeClasses,
        'active:scale-95',
        'outline-none focus-visible:ring-4 focus-visible:ring-ring/20',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        destructive
          ? cn(
              size === 'lg' ? 'bg-destructive/6 text-destructive/55 active:bg-destructive/12' : 'text-muted-foreground/50',
              'hover:bg-destructive/8 hover:text-destructive',
            )
          : cn(
              size === 'lg' ? 'bg-muted/35 text-foreground/50 active:bg-muted/60' : 'text-muted-foreground/55',
              'hover:bg-muted hover:text-foreground',
            ),
        className,
      )}
    >
      <Icon className={iconSizeClasses} />
    </button>
  )
}
