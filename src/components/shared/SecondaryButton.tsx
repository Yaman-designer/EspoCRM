'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface SecondaryButtonSharedProps {
  label: string
  icon?: IconType
  /** Extra classes applied to the icon only — e.g. `'rotate-180'` for a
   *  disclosure toggle (Show all / Show fewer). Layout/motion classes on the
   *  icon itself stay fixed; this only adds a caller-driven state class. */
  iconClassName?: string
  disabled?: boolean
  className?: string
}

interface LinkActionProps extends SecondaryButtonSharedProps {
  href: string
  onClick?: undefined
  loading?: undefined
}

interface ButtonActionProps extends SecondaryButtonSharedProps {
  href?: undefined
  onClick: () => void
  loading?: boolean
}

export type SecondaryButtonProps = LinkActionProps | ButtonActionProps

// Button System — Variant 2 (Secondary Action). The ONE component for every
// "Browse all / Full Specifications / Show more / View history / Manage
// documents" style action across the Property Details experience: same
// height, radius, padding, icon alignment and interaction states everywhere
// it's used, by construction (one implementation, not a family of
// look-alikes). Motion and focus tokens match src/components/ui/button.tsx
// (duration-250 ease-in-out, active:scale-[0.98], ring-4 ring-ring/20) —
// same interaction language as Variant 1 (Primary), just at secondary/pill
// weight. A soft filled pill instead of a bare text link or an outlined box
// on purpose: color-only hover cues never fire on touch, so the tap target
// needs a persistent boundary (fill + shape) visible at rest — see
// RelatedPropertiesSection's original "Browse all" mobile-affordance fix,
// which is what this component was generalized from.
//
// Width is intentionally NOT part of this component's contract — callers
// that need a full-width bar (e.g. Timeline's disclosure toggle sitting
// below a list) wrap it in a full-width container or pass `className`;
// height/radius/padding/motion stay identical either way, which is the part
// of "same everywhere" that actually matters for a shared interaction
// language.
const PILL_CLASSES = [
  'group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full select-none',
  'bg-muted/40 py-2 pl-3.5 pr-3 text-[11px] font-semibold leading-none whitespace-nowrap',
  'text-muted-foreground/70',
  'transition-all duration-250 ease-in-out',
  'hover:bg-muted/70 hover:text-foreground',
  'active:scale-[0.98] active:bg-muted/80 active:duration-100',
  'outline-none focus-visible:ring-4 focus-visible:ring-ring/20',
  'disabled:pointer-events-none disabled:opacity-50',
  'aria-disabled:pointer-events-none aria-disabled:opacity-50',
  'motion-reduce:transition-colors motion-reduce:active:scale-100',
].join(' ')

const BASE_ICON_CLASSES = 'size-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0'

// Must render as a descendant of <Link>, not inline in the component that
// returns it — useLinkStatus reads pending state off that subtree. On a
// prefetched route (the common case for an in-app destination like
// /properties) `pending` never flips true and this never renders the
// spinner; it only engages when navigation genuinely blocks on the network,
// which is exactly when a loading cue earns its keep instead of just
// flashing on every click.
function NavIcon({ icon: Icon, iconClassName }: { icon: IconType; iconClassName?: string }) {
  const { pending } = useLinkStatus()
  if (pending) {
    return <Loader2 className="size-3 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
  }
  return <Icon className={cn(BASE_ICON_CLASSES, iconClassName)} aria-hidden />
}

export function SecondaryButton(props: SecondaryButtonProps) {
  const Icon = props.icon ?? ArrowRight
  const { label, disabled, className, iconClassName } = props

  if (props.href !== undefined) {
    if (disabled) {
      // A native anchor has no disabled state — render an inert span instead
      // of a Link so the destination genuinely can't be activated (keyboard
      // or pointer), rather than faking it with a click handler that no-ops.
      return (
        <span aria-disabled="true" className={cn(PILL_CLASSES, className)}>
          {label}
          <Icon className={cn(BASE_ICON_CLASSES, iconClassName)} aria-hidden />
        </span>
      )
    }
    return (
      <Link href={props.href} className={cn(PILL_CLASSES, className)}>
        {label}
        <NavIcon icon={Icon} iconClassName={iconClassName} />
      </Link>
    )
  }

  const { onClick, loading } = props
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(PILL_CLASSES, className)}
    >
      {label}
      {loading
        ? <Loader2 className="size-3 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
        : <Icon className={cn(BASE_ICON_CLASSES, iconClassName)} aria-hidden />}
    </button>
  )
}
