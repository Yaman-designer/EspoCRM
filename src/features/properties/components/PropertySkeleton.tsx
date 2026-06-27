import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Grid card skeleton ────────────────────────────────────────────────────────
// Structural mirror of PropertyCard (grid variant). Every measurement matched
// to the live card to prevent CLS during skeleton → content transition.
//
// rounded-3xl          ← matches article rounded-3xl
// aspect-4/3           ← matches image wrapper (both mobile and desktop now)
// px-4 pt-4            ← matches content div padding
// Mobile price: h-8 w-3/5  ← matches text-[26px] font-bold leading-none
// Mobile stats: columnar 3-col with w-px separators, h-9.5 each col
// Footer: seamless on mobile (no border-t), h-12 rounded-2xl CTA

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-3xl bg-card',
        'border border-border/18 sm:border-border/25',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08),0_20px_48px_rgba(0,0,0,0.06)] sm:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.07)]',
        className,
      )}
    >
      {/* Image — aspect-4/3 on both mobile and desktop */}
      <div className="aspect-4/3 w-full animate-pulse rounded-t-3xl bg-muted" />

      {/* Body — px-4 pb-0 pt-4 mobile / sm:px-3 sm:pb-0 sm:pt-2.5 desktop */}
      <div className="flex flex-1 flex-col px-4 pb-0 pt-4 sm:px-3 sm:pb-0 sm:pt-2.5">

        {/* Price — mobile hero (sm:hidden); h-8 matches text-[28px] leading-none; mb-4 matches card */}
        <Skeleton className="mb-4 h-8 w-3/5 rounded-md sm:hidden" />

        {/* Type chip — order-1 mobile (neutral pill), order-3 desktop */}
        <Skeleton className="order-1 mb-2 h-5.5 w-16 rounded-full sm:order-3 sm:mb-1.5 sm:h-6.5 sm:w-20" />

        {/* Reference — order-2 mobile (compact code tag), order-1 desktop (large heading) */}
        <Skeleton className="order-2 mb-1.5 h-4 w-24 rounded-md sm:order-1 sm:mb-1 sm:h-6 sm:w-4/5" />

        {/* Location — order-3 mobile; order-2 desktop — icon size-3.5 mobile / size-3 desktop */}
        <div className="order-3 mb-2 flex items-center gap-1.5 sm:mb-1 sm:gap-1">
          <Skeleton className="size-3.5 shrink-0 rounded-full sm:size-3" />
          <Skeleton className="h-3 w-2/5 rounded-md" />
        </div>

        {/* Divider — order-5 */}
        <div className="order-5 mb-3 h-px bg-border/22 sm:mb-1.5 sm:bg-border/25" />

        {/* Stats — mobile: grouped container with hairline separators (sm:hidden) */}
        {/* h-11 = py-1.5(12) + value(15) + mt-1.5(6) + icon+label(12) = 45px ≈ h-11(44px) */}
        <div className="order-6 overflow-hidden rounded-2xl border border-border/20 bg-muted/25 flex items-stretch sm:hidden">
          <Skeleton className="h-11 flex-1 rounded-none bg-transparent" />
          <div className="w-px self-stretch bg-border/25" />
          <Skeleton className="h-11 flex-1 rounded-none bg-transparent" />
          <div className="w-px self-stretch bg-border/25" />
          <Skeleton className="h-11 flex-1 rounded-none bg-transparent" />
        </div>

        {/* Stats — desktop: StatChip row (hidden sm:flex) */}
        <div className="order-6 hidden gap-1.5 sm:flex">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </div>

      </div>

      {/* Footer — seamless mobile (px-4 pb-4 pt-3) / muted bar desktop */}
      <div className="px-4 pb-4 pt-3 sm:border-t sm:border-border/25 sm:bg-muted/30 sm:px-2.5 sm:py-2">
        <div className="flex items-center gap-2 sm:gap-1.5">
          {/* Details: h-12 rounded-2xl / sm:h-7 sm:rounded-full */}
          <Skeleton className="h-12 flex-1 rounded-2xl sm:h-7 sm:rounded-full" />
          {/* Edit: h-12 w-11 rounded-2xl / sm:h-8 sm:w-8 sm:rounded-full */}
          <Skeleton className="h-12 w-11 shrink-0 rounded-2xl sm:h-8 sm:w-8 sm:rounded-full" />
          {/* Delete: h-12 w-11 rounded-2xl / sm:h-8 sm:w-8 sm:rounded-full */}
          <Skeleton className="h-12 w-11 shrink-0 rounded-2xl sm:h-8 sm:w-8 sm:rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ── List row skeleton — mirrors PropertyListRow layout ────────────────────────
// PropertyListRow is a 3-zone horizontal card:
//   LEFT   w-36 (mobile) / w-52 (sm+)  — image, full-height, rounded-l-[20px]
//   CENTER flex-1                       — price, ref, location, type, stats+CTA
//   RIGHT  hidden sm:flex               — action icons

export function PropertyListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-w-[320px] overflow-hidden rounded-[20px] bg-card',
        'border border-border/25',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
        className,
      )}
    >
      {/* LEFT: Image — w-36 mobile, w-52 desktop, full height, rounded-l-[20px] */}
      <div className="w-36 shrink-0 animate-pulse rounded-l-[20px] bg-muted sm:w-52" />

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
        <Skeleton className="mt-3 h-6.5 w-16 rounded-full" />

        {/* Row 5: Stats */}
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-11 flex-1 rounded-[12px]" />
          <Skeleton className="h-11 flex-1 rounded-[12px]" />
          <Skeleton className="h-11 flex-1 rounded-[12px]" />
          <Skeleton className="hidden h-11 flex-1 rounded-[12px] sm:block" />
        </div>
      </div>

      {/* RIGHT: Action panel — desktop only */}
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
//
// Grid view breakpoints (container width, not viewport):
//   default    → 1 col   (mobile, matches PropertyGrid grid-cols-1)
//   @[600px]   → 3 cols
//   @[1100px]  → 4 cols
//   @[1280px]  → 5 cols
//   @[1560px]  → 6 cols

export function PropertySkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-1 gap-4 @[600px]:grid-cols-3 @[1100px]:grid-cols-4 @[1280px]:grid-cols-5 @[1560px]:grid-cols-6">
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

// ── PropertyDetailSkeleton ────────────────────────────────────────────────────
// Full-page skeleton for the /properties/[slug] detail route.
// Mirrors PropertyDetailView's layout: 8-col editorial left + 4-col sticky right.
// The right panel renders first (order-first) to match the live view's DOM order.

export function PropertyDetailSkeleton() {
  return (
    <div className="min-h-0">
      <div className="mx-auto max-w-400 px-8 pb-28 pt-8">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-44 rounded-md" />
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">

          {/* ── LEFT: editorial column ────────────────────────────────── */}
          <div className="order-2 min-w-0 space-y-12 lg:order-1 lg:col-span-8">

            {/* Hero gallery */}
            <div className="aspect-video w-full animate-pulse rounded-[24px] bg-muted/55" />

            {/* Description section */}
            <div className="space-y-5 px-1">
              <Skeleton className="h-3 w-36 rounded" />
              {/* Pull-quote block */}
              <div className="border-l-[2.5px] border-border/18 pl-7">
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="mt-3 h-6 w-4/5 rounded" />
              </div>
              {/* Body copy */}
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-[92%] rounded" />
                <Skeleton className="h-3.5 w-[85%] rounded" />
                <Skeleton className="h-3.5 w-3/4 rounded" />
              </div>
            </div>

            {/* Facts section */}
            <div className="px-1">
              {/* Property name */}
              <Skeleton className="h-9 w-3/5 rounded-lg" />
              <Skeleton className="mt-4 h-3 w-40 rounded" />
              {/* Thin rule */}
              <div className="my-9 h-px bg-border/14" />
              {/* Physical stat bar — 3 large editorial numbers */}
              <div className="flex items-start gap-14">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i}>
                    <Skeleton className="h-11 w-14 rounded-lg" />
                    <Skeleton className="mt-3 h-2.5 w-20 rounded" />
                  </div>
                ))}
              </div>
              {/* Secondary attribute bar */}
              <div className="mt-10 flex items-center gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-3 w-14 rounded" />
                ))}
              </div>
              <div className="mt-9 h-px bg-border/14" />
            </div>

            {/* Amenities — 3-col grid */}
            <div className="px-1">
              <Skeleton className="mb-10 h-3 w-40 rounded" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="rounded-[20px] border border-border/12 bg-muted/14 p-5">
                    <div className="mb-4 flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded-lg" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                    <div className="space-y-2.5">
                      {Array.from({ length: 4 }, (_, j) => (
                        <Skeleton key={j} className="h-3 w-[70%] rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location placeholder */}
            <Skeleton className="h-64 w-full rounded-[24px]" />

            {/* Documents card */}
            <div className="rounded-[24px] border border-border/18 bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06)]">
              <div className="mb-8 flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-36 rounded" />
                  <Skeleton className="h-5 w-64 rounded" />
                </div>
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="overflow-hidden rounded-[20px] border border-border/18 bg-card">
                    <Skeleton className="h-24 w-full rounded-none" />
                    <div className="p-4 pt-3.5 space-y-2">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT: sticky price panel ─────────────────────────────── */}
          <div className="order-first min-w-0 lg:order-last lg:col-span-4 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-border/18 bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)]">

              {/* Accent strip */}
              <div className="h-0.75 animate-pulse bg-muted/50" />

              <div className="space-y-5 p-6">

                {/* Price block */}
                <div className="space-y-2">
                  <Skeleton className="h-2.5 w-20 rounded" />
                  <Skeleton className="h-11 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-44 rounded" />
                </div>

                {/* Status + type + ref chips */}
                <div className="flex items-center gap-2 border-b border-border/8 pb-5">
                  <Skeleton className="h-6.5 w-20 rounded-full" />
                  <Skeleton className="h-6.5 w-16 rounded-full" />
                  <Skeleton className="h-6.5 w-20 rounded-full" />
                </div>

                {/* Stat chips — 4-col */}
                <div className="grid grid-cols-4 gap-2 border-b border-border/8 pb-5">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-15.5 rounded-lg" />
                  ))}
                </div>

                {/* Address block */}
                <Skeleton className="h-20 w-full rounded-lg" />

                {/* Meta rows */}
                <div className="divide-y divide-border/6 border-y border-border/8">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <Skeleton className="h-3 w-16 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                  ))}
                </div>

                {/* Primary CTA */}
                <Skeleton className="h-12 w-full rounded-2xl" />

                {/* Secondary CTAs 2-col */}
                <div className="grid grid-cols-2 gap-2.5">
                  <Skeleton className="h-11 rounded-2xl" />
                  <Skeleton className="h-11 rounded-2xl" />
                </div>

                {/* Utility actions */}
                <div className="grid grid-cols-2 gap-2 border-t border-border/8 pt-5">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-10 rounded-2xl" />
                  ))}
                </div>

                {/* Completeness bar placeholder */}
                <div className="space-y-1.5 border-t border-border/8 pt-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-2.5 w-24 rounded" />
                    <Skeleton className="h-2.5 w-10 rounded" />
                  </div>
                  <Skeleton className="h-1 w-full rounded-full" />
                </div>

                {/* Danger */}
                <div className="border-t border-border/8 pt-3">
                  <Skeleton className="h-9 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
