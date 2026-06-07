import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Grid card skeleton — mirrors PropertyCard layout exactly ──────────────────

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // p-3 + gap-3 + rounded-3xl match PropertyCard's padded layout
        'flex flex-col gap-3 rounded-3xl bg-card p-3',
        'border border-border/40 shadow-design-sm',
        className,
      )}
    >
      {/* Image — inside padding, own rounded corners */}
      <Skeleton className="aspect-4/3 w-full shrink-0 rounded-xl" />

      {/* Content */}
      <div className="flex flex-col">

        {/* Name (2-line) + type chip */}
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
          </div>
          <Skeleton className="mt-0.5 h-5 w-14 shrink-0 rounded-full" />
        </div>

        {/* Price */}
        <div className="mb-1.5">
          <Skeleton className="h-6 w-36 rounded-md" />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-2/5 rounded-md" />
        </div>

        {/* Divider */}
        <div className="my-3 h-px bg-border/40" />

        {/* Spec row — icon + value pairs */}
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-3 w-8 rounded-md" />
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

export function PropertySkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
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
