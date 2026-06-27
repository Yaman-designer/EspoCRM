'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading skeleton shown while form config or initial data is fetching.
 * Mirrors the exact visual structure of FormFramework so there's no layout shift.
 */
export function FormSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col">

      {/* Page header skeleton */}
      <div className="px-6 pb-6 pt-8">
        <div className="mx-auto max-w-[720px] space-y-3">
          <Skeleton className="h-3 w-40 rounded-full" />
          <Skeleton className="h-7 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
      </div>

      {/* Stepper skeleton */}
      <div className="border-b border-border bg-background px-6 pb-5 pt-4">
        <div className="mx-auto max-w-[720px]">
          <div className="hidden lg:flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2.5">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                {i < 4 && (
                  <div className="flex-1 px-2 pt-5">
                    <Skeleton className="h-px w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Mobile/tablet skeleton */}
          <div className="flex items-center justify-between lg:hidden">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* Step card skeleton */}
      <div className="flex-1 px-6 pt-8">
        <div className="mx-auto max-w-[720px]">
          <Skeleton className="mb-5 h-3 w-20 rounded-md" />

          <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-design-md">
            {/* Card header */}
            <div className="border-b border-border px-8 py-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 rounded-md" />
                  <Skeleton className="h-3.5 w-72 rounded-md" />
                </div>
              </div>
            </div>
            {/* Card body */}
            <div className="space-y-6 px-8 py-8">
              <div className="grid grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar skeleton */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between">
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
    </div>
  )
}
