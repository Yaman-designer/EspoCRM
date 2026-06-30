'use client'

import { Skeleton } from '@/components/ui/skeleton'

type SkeletonMode = 'full' | 'card-only' | 'stepper-only'

interface FormSkeletonProps {
  mode?: SkeletonMode
  /** Number of stepper steps to render (default: 5) */
  stepCount?: number
  /** Number of field placeholder rows in card body (default: 6) */
  fieldCount?: number
}

/**
 * Pixel-matched loading skeleton for FormFramework.
 * Mirrors the exact visual layout so there is zero shift when content loads.
 */
export function FormSkeleton({
  mode = 'full',
  stepCount = 5,
  fieldCount = 6,
}: FormSkeletonProps) {
  const showHeader = mode === 'full'
  const showStepper = mode === 'full' || mode === 'stepper-only'
  const showCard = mode === 'full' || mode === 'card-only'

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col" aria-busy="true" aria-label="Loading form">

      {/* ── Page header skeleton ── */}
      {showHeader && (
        <div className="px-6 pb-6 pt-8">
          <div className="mx-auto max-w-180 space-y-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-2.5 w-20 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2.5 w-28 rounded-full" />
            </div>
            {/* Title + badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-7 w-52 rounded-lg" />
                <Skeleton className="h-4 w-80 rounded-md" />
              </div>
              <Skeleton className="mt-1.5 h-6 w-24 rounded-full" />
            </div>
            {/* Metadata strip */}
            <div className="flex items-center gap-3 pt-0.5">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-px" />
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── Stepper skeleton ── */}
      {showStepper && (
        <div className="border-b border-border bg-background px-6 pb-5 pt-4">
          <div className="mx-auto max-w-180">
            {/* Desktop stepper */}
            <div className="hidden lg:flex items-start">
              {Array.from({ length: stepCount }).map((_, i) => (
                <div key={i} className={i < stepCount - 1 ? 'flex flex-1 items-start' : 'flex items-start flex-none'}>
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-2.5 w-6 rounded-md" />
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <Skeleton className="h-3 w-14 rounded-md" />
                  </div>
                  {i < stepCount - 1 && (
                    <div className="flex-1 pt-11">
                      <Skeleton className="h-px w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Mobile / tablet stepper */}
            <div className="lg:hidden space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step card skeleton ── */}
      {showCard && (
        <div className="flex-1 px-6 pt-8">
          <div className="mx-auto max-w-180">
            {/* Step label */}
            <Skeleton className="mb-5 h-3 w-20 rounded-md" />

            {/* Card */}
            <div className="overflow-hidden rounded-[24px] border border-border/30 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_3px_16px_rgba(16,24,40,0.05)]">
              {/* Card header */}
              <div className="border-b border-border/20 px-4 py-5 sm:px-8 sm:py-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-44 rounded-md" />
                    <Skeleton className="h-3.5 w-72 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-4 py-5 sm:px-8 sm:py-8">
                <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                  {Array.from({ length: Math.min(fieldCount, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'space-y-2',
                        i === fieldCount - 1 && fieldCount % 2 === 1 && 'col-span-2',
                      )}
                    >
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
                {fieldCount > 8 && (
                  <div className="mt-5 space-y-2">
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Action bar skeleton ── */}
      {mode === 'full' && (
        <div className="sticky bottom-0 border-t border-border bg-card/95 px-6 py-4">
          <div className="mx-auto flex max-w-180 items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-10 rounded-md" />
            <div className="flex gap-2.5">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-11 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Tailwind needs this helper available at module scope */
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
