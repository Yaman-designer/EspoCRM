import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Grid card skeleton ────────────────────────────────────────────────────────
// DOM must be a 1:1 structural mirror of PropertyCard (grid variant).
// Every wrapper element, element type, and spacing must match so that
// switching skeleton → real card produces zero layout shift.
//
// PropertyCard structure (keep in sync):
//   article  rounded-2xl overflow-hidden bg-card flex flex-col
//     div [IMAGE]  aspect-8/5 w-full shrink-0             (16:10 ratio, ~175px at 280px width)
//     div [BODY]   px-4 pt-3 pb-3 flex-1 flex flex-col
//       h3  [TITLE]     mb-0.5
//       div [TYPE+REF]  mb-2 flex gap-1.5
//       p   [LOCATION]  mb-3 flex items-center gap-1
//       div [DIVIDER]   mb-2.5 h-px
//       div [SPECS]     mb-2.5 flex items-center gap-3
//       div [ACTIONS]   mt-auto border-t pt-2.5 hidden sm:flex justify-between

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-card',
        'border border-border/40',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {/* [IMAGE] — matches aspect-8/5 (16:10) full-bleed image */}
      <div className="aspect-8/5 w-full animate-pulse bg-muted" />

      {/* [BODY] */}
      <div className="flex flex-1 flex-col px-4 pt-3 pb-3">

        {/* [TITLE] — mb-0.5, 14px text */}
        <div className="mb-0.5">
          <Skeleton className="h-3.5 w-4/5 rounded-md" />
        </div>

        {/* [TYPE+REF] — mb-2 flex gap-1.5 */}
        <div className="mb-2 flex items-center gap-1.5">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-2.5 w-20 rounded-md" />
        </div>

        {/* [LOCATION] — mb-3 flex items-center gap-1 */}
        <div className="mb-3 flex items-center gap-1">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-2/5 rounded-md" />
        </div>

        {/* [DIVIDER] — mb-2.5 h-px */}
        <div className="mb-2.5 h-px bg-border/40" />

        {/* [SPECS] — mb-2.5 flex items-center gap-3 */}
        <div className="mb-2.5 flex items-center gap-3">
          <Skeleton className="h-3 w-14 rounded-md" />
          <Skeleton className="h-3 w-14 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>

        {/* [ACTIONS] — mt-auto border-t pt-2.5, desktop only */}
        <div className="mt-auto hidden items-center justify-between border-t border-border/30 pt-2.5 sm:flex">
          <div className="flex items-center gap-0.5">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>

      </div>
    </div>
  )
}

// ── List row skeleton — mirrors PropertyListRow layout ────────────────────────
// PropertyListRow structure (keep in sync):
//   div  flex items-center gap-3 rounded-2xl bg-card p-3
//     div  relative h-20 w-30 shrink-0 rounded-xl   thumbnail
//     div  flex min-w-0 flex-1 flex-col gap-0.5      info (title, ref, location)
//     div  hidden sm:flex shrink-0 items-center gap-2.5  features
//     div  flex shrink-0 flex-col items-end gap-1.5  price+status
//     div  actions (sm: quick buttons, <sm: 3-dot sheet button)

export function PropertyListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-card p-3',
        'border border-border/40',
        'shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]',
        className,
      )}
    >
      {/* Thumbnail — h-20 w-30 matches PropertyListRow exactly */}
      <Skeleton className="h-20 w-30 shrink-0 rounded-xl" />

      {/* Info — title + ref + location */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Skeleton className="h-3.5 w-2/5 rounded-md" />
        <Skeleton className="h-2.5 w-16 rounded-md" />
        <Skeleton className="mt-0.5 h-3 w-1/3 rounded-md" />
      </div>

      {/* Features — hidden on small, visible on sm+ */}
      <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
        <Skeleton className="h-3 w-12 rounded-md" />
        <Skeleton className="h-3 w-10 rounded-md" />
        <Skeleton className="h-3 w-12 rounded-md" />
      </div>

      {/* Price + Status */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Actions */}
      <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="size-9 shrink-0 rounded-full sm:hidden" />
    </div>
  )
}

// ── Grid + List skeleton containers ───────────────────────────────────────────
// Grid classes MUST stay byte-for-byte identical to PropertyGrid.tsx grid div.

export function PropertySkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-4 @[576px]:grid-cols-3 @[872px]:grid-cols-4 @[1168px]:grid-cols-5 @[1464px]:grid-cols-6">
        {Array.from({ length: count }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function PropertySkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <PropertyListRowSkeleton key={i} />
      ))}
    </div>
  )
}
