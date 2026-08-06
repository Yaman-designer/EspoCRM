'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  Building2,
  Home,
  Loader2,
  RefreshCw,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type FeedbackVariant = 'error' | 'loading-failure' | 'warning' | 'success' | 'empty' | 'offline'

// Resolved internally from a string key rather than accepted as a component
// reference — a Lucide component isn't a plain object, so a Server Component
// (e.g. not-found.tsx) can't pass one as a prop into this Client Component
// without tripping the "Only plain objects can be passed to Client
// Components from Server Components" RSC error. A key is just a string, so
// it always serializes across that boundary regardless of which side the
// call site lives on. Add new scenarios' icons here as they come up.
const ICONS = {
  alert: AlertTriangle,
  building: Building2,
  home: Home,
  refresh: RefreshCw,
  search: Search,
} as const satisfies Record<string, LucideIcon>

export type FeedbackIconKey = keyof typeof ICONS

interface FeedbackAction {
  label: string
  icon?: FeedbackIconKey
  href?: string
  onClick?: () => void
  loading?: boolean
}

interface FeedbackStateProps {
  variant: FeedbackVariant
  /** Always explicit, never inferred from variant — the same "empty" state
   *  reads as "search" for a search miss and "building" for an empty
   *  portfolio. Variant only supplies the accent color. */
  icon: FeedbackIconKey
  /** Small pill above the title, e.g. "Server Error" or "404". Optional —
   *  most empty/success states don't need one. */
  eyebrow?: string
  /** Subtle status code shown inline with the eyebrow, e.g. "500". Only
   *  rendered when `eyebrow` is also set. */
  code?: string
  title: string
  description: string
  /** Quiet reassurance line under the description — e.g. "Your data is
   *  safe. Nothing has been lost." Kept visually secondary to `description`. */
  note?: string
  primaryAction?: FeedbackAction
  secondaryAction?: FeedbackAction
  /** Technical detail (error digest, status code) — rendered as a quiet,
   *  collapsed disclosure below the actions, never competing with them. */
  details?: string
  className?: string
}

// Feedback State system. One component for every "nothing/something went
// wrong" screen in the app — Server Error, Network Error, Permission
// Denied, Property Not Found, Map Loading Failure, Documents Failed, Empty
// Search, Empty Property List, Offline, Maintenance Mode. Each scenario
// maps onto one of the six variants below for its accent color; icon,
// title, description and actions are always scenario-specific.
//
// Every token here already existed before this component: `border-border`,
// `bg-card`, `shadow-design-*`, `.map-grid` (the same premium-cartography
// texture LocationIntelligenceCenter's map background already uses), and
// `Button`. No new color was introduced to build this — only a dedicated
// `.fb-mount` entrance (reduced-motion handled at its own definition,
// separate from Form Framework's `.ff-form-mount` since this is a page-level
// feedback surface, not a form step).
const ACCENT: Record<FeedbackVariant, { icon: string; badge: string }> = {
  error:              { icon: 'text-destructive',      badge: 'bg-destructive/10 border-destructive/20' },
  'loading-failure':  { icon: 'text-destructive/80',   badge: 'bg-destructive/8 border-destructive/15' },
  warning:            { icon: 'text-amber-600',        badge: 'bg-amber-500/10 border-amber-500/25' },
  success:            { icon: 'text-brand-emerald',    badge: 'bg-brand-emerald/10 border-brand-emerald/20' },
  empty:              { icon: 'text-primary',          badge: 'bg-primary/10 border-primary/20' },
  offline:            { icon: 'text-muted-foreground', badge: 'bg-muted border-border' },
}

function FeedbackActionButton({ action, primary }: { action: FeedbackAction; primary?: boolean }) {
  const Icon = action.icon ? ICONS[action.icon] : undefined

  if (action.href) {
    return (
      <Button asChild variant={primary ? 'default' : 'ghost'} size="sm" className="gap-1.5">
        <Link href={action.href}>
          {Icon && <Icon className="size-4" aria-hidden />}
          {action.label}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={primary ? 'default' : 'ghost'}
      size="sm"
      onClick={action.onClick}
      disabled={action.loading}
      className="gap-1.5"
    >
      {action.loading
        ? <Loader2 className="size-4 animate-spin" aria-hidden />
        : Icon && <Icon className="size-4" aria-hidden />}
      {action.loading ? 'Retrying…' : action.label}
    </Button>
  )
}

export function FeedbackState({
  variant,
  icon,
  eyebrow,
  code,
  title,
  description,
  note,
  primaryAction,
  secondaryAction,
  details,
  className,
}: FeedbackStateProps) {
  const accent = ACCENT[variant]
  const Icon = ICONS[icon]

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-3xl border border-border/40 bg-card',
        'shadow-design-sm transition-shadow duration-(--duration-standard) hover:shadow-design-md',
        className,
      )}
    >
      {/* Real-estate/map identity — same .map-grid texture used behind the
          live property map, at 5% opacity and faded at the edges via mask
          so it reads as ambient texture, never a competing pattern. */}
      <div
        aria-hidden
        className="map-grid pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="fb-mount relative flex flex-col items-center px-6 py-11 text-center sm:px-10">
        <div
          aria-hidden
          className={cn('flex h-[72px] w-[72px] items-center justify-center rounded-full border shadow-design-xs', accent.badge)}
        >
          <Icon className={cn('size-8', accent.icon)} strokeWidth={1.5} aria-hidden />
        </div>

        {eyebrow && (
          <span
            className={cn(
              'mt-5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              accent.badge,
              accent.icon,
            )}
          >
            {eyebrow}
            {code && (
              <span className="font-mono text-[11px] font-normal normal-case tracking-normal text-muted-foreground/70">
                · {code}
              </span>
            )}
          </span>
        )}

        <h2 className={cn('max-w-sm font-heading text-2xl font-bold tracking-tight text-foreground', eyebrow ? 'mt-3' : 'mt-5')}>
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
        {note && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground/70">{note}</p>}

        {(primaryAction || secondaryAction) && (
          <>
            <div aria-hidden className="mt-6 h-px w-10 bg-border/70" />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {primaryAction && <FeedbackActionButton action={primaryAction} primary />}
              {secondaryAction && <FeedbackActionButton action={secondaryAction} />}
            </div>
          </>
        )}

        {details && (
          <details className="mt-5 max-w-sm text-left">
            <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground/60 outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 rounded">
              Technical details
            </summary>
            <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted-foreground/70">
              {details}
            </p>
          </details>
        )}
      </div>
    </div>
  )
}
