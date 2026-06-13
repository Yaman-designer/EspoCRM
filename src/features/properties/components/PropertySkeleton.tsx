import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Grid card skeleton ────────────────────────────────────────────────────────
// Structural mirror of PropertyCard (grid variant).
// IMPORTANT: The image container uses h-48/sm:aspect-video to match PropertyCard.
// The grid breakpoints in PropertySkeletonGrid MUST stay identical to PropertyGrid.

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-card',
        'border border-border/30',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.07)]',
        className,
      )}
    >
      {/* Image — h-48 mobile / aspect-video desktop, mirrors PropertyCard */}
      <div className="h-48 w-full animate-pulse bg-muted sm:aspect-video sm:h-auto" />

      {/* Body */}
      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-3">

        {/* Reference heading */}
        <Skeleton className="mb-2 h-4 w-4/5 rounded-md" />

        {/* Location */}
        <div className="mb-2 flex items-center gap-1">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-2/5 rounded-md" />
        </div>

        {/* Type chip */}
        <Skeleton className="mb-3 h-4.5 w-16 rounded-full" />

        {/* Divider */}
        <div className="mb-2 h-px bg-border/15" />

        {/* Stats chips */}
        <div className="mb-2 flex gap-1.5">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>

        {/* Footer actions — desktop only */}
        <div className="mt-3 hidden items-center gap-1.5 border-t border-border/15 pt-2.5 sm:flex">
          <Skeleton className="h-9.5 flex-1 rounded-lg" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>

      </div>
    </div>
  )
}

// ── List row skeleton — mirrors PropertyListRow layout ────────────────────────
// PropertyListRow is a 3-zone horizontal card:
//   LEFT   w-36 (mobile) / w-52 (sm+)  — image, full-height, rounded-l-xl
//   CENTER flex-1                       — price, ref, location, type, stats+CTA
//   RIGHT  hidden sm:flex sm:w-9        — action icons

export function PropertyListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-w-[320px] overflow-hidden rounded-xl bg-card',
        'border border-border/25',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
        className,
      )}
    >
      {/* LEFT: Image — w-36 mobile, w-52 desktop, full height, rounded-l-xl */}
      <div className="w-36 shrink-0 animate-pulse rounded-l-xl bg-muted sm:w-52" />

      {/* CENTER: Info column */}
      <div className="flex min-w-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">

        {/* Row 1: Price */}
        <Skeleton className="h-6 w-28 rounded-md" />

        {/* Row 2: Reference */}
        <Skeleton className="mt-2 h-3 w-24 rounded-md" />

        {/* Row 3: Location */}
        <div className="mt-2 flex items-center gap-1.5">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>

        {/* Row 4: Type chip */}
        <Skeleton className="mt-3 h-4.5 w-16 rounded-full" />

        {/* Row 5: Stats + CTA */}
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-11 flex-1 rounded-[12px]" />
          <Skeleton className="h-11 flex-1 rounded-[12px]" />
          <Skeleton className="h-11 flex-1 rounded-[12px]" />
          <Skeleton className="hidden h-11 flex-1 rounded-[12px] sm:block" />
        </div>
      </div>

      {/* RIGHT: Action panel — desktop only, w-9 */}
      <div className="hidden w-9 shrink-0 flex-col items-center justify-start gap-1 border-l border-border/10 py-4 sm:flex">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </div>
  )
}

// ── Grid + List skeleton containers ───────────────────────────────────────────
// CRITICAL: Grid breakpoints here MUST be byte-for-byte identical to
// PropertyGrid.tsx to avoid column-count mismatch during skeleton → content
// transition (which would produce visible layout shift).

export function PropertySkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-4 @[600px]:grid-cols-3 @[1100px]:grid-cols-4 @[1280px]:grid-cols-5 @[1560px]:grid-cols-6">
        {Array.from({ length: count }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function PropertySkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-1 gap-4 @[920px]:grid-cols-2 @[1500px]:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <PropertyListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
