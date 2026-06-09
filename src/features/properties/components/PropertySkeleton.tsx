import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Grid card skeleton ────────────────────────────────────────────────────────
// Must mirror PropertyCard exactly so layout shift on load → content is zero.
// Changes here must stay in sync with PropertyCard.tsx:
//   • rounded-2xl overflow-hidden (no outer padding — image is edge-to-edge)
//   • aspect-8/5 image (16:10)
//   • p-3 content section with the same 5-row hierarchy
//   • price stacked vertically (price then badge below, mb-2 wrapper)

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-card',
        'border border-border/40 shadow-design-sm',
        className,
      )}
    >
      {/* Image — 16:10, edge-to-edge, rounded-none so parent clips it */}
      <Skeleton className="w-full shrink-0 rounded-none" style={{ aspectRatio: '8/5' }} />

      {/* Content — matches PropertyCard's p-3 content section */}
      <div className="flex flex-col p-3">

        {/* Row 1: type badge + property code */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>

        {/* Row 2: title (2-line) */}
        <div className="mb-2 flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-4/5 rounded-md" />
          <Skeleton className="h-3.5 w-3/5 rounded-md" />
        </div>

        {/* Row 3: price then context badge below (mirrors PropertyCard stacked layout) */}
        <div className="mb-2 min-w-0">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="mt-1.5 h-4 w-14 rounded-full" />
        </div>

        {/* Row 4: location */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-2/5 rounded-md" />
        </div>

        {/* Divider */}
        <div className="my-2.5 h-px bg-border/40" />

        {/* Row 5: specs */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-8 rounded-md" />
          <Skeleton className="h-3 w-8 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>

      </div>
    </div>
  )
}

// ── List row skeleton — mirrors PropertyListRow layout ────────────────────────

export function PropertyListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl bg-card p-3',
        'border border-border/40 shadow-design-sm',
        className,
      )}
    >
      {/* Thumbnail */}
      <Skeleton className="h-18 w-27.5 shrink-0 rounded-xl" />

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-2/5 rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-2.5 w-16 rounded-md" />
          <Skeleton className="h-2.5 w-10 rounded-md" />
          <Skeleton className="h-2.5 w-10 rounded-md" />
        </div>
      </div>

      {/* Price + Status */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-5.5 w-16 rounded-full" />
      </div>

      {/* Menu */}
      <Skeleton className="size-7 shrink-0 rounded-full" />
    </div>
  )
}

// ── Grid + List skeleton containers ───────────────────────────────────────────
// Grid classes must stay in sync with PropertyGrid.tsx.

export function PropertySkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-3 @[872px]:grid-cols-3 @[872px]:gap-4 @[1168px]:grid-cols-4 @[1168px]:gap-5 @[1464px]:grid-cols-5 @[1464px]:gap-6">
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
