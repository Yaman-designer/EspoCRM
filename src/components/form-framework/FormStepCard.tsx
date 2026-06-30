'use client'

import { type RefObject, type ReactNode } from 'react'
import { ExternalLink, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormFramework } from './context'
import type { StepEmptyState } from './types'

/* ─── Step loading skeleton ───────────────────────────────────────────
   Mirrors the actual card layout so the loading state feels native.
────────────────────────────────────────────────────────────────────── */

function PremiumCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border/30 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_3px_16px_rgba(16,24,40,0.05)]">
      {/* Header zone */}
      <div className="px-4 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3.5 w-36 rounded-md" />
            <Skeleton className="h-3 w-52 rounded" />
          </div>
        </div>
      </div>
      <div className="mx-4 border-b border-border/20 sm:mx-8" />
      {/* Body zone */}
      <div className="px-4 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-6">
        <div className="grid grid-cols-12 gap-x-6 gap-y-5">
          {Array.from({ length: rows }).map((_, i) => {
            /* Alternate full-width and half-width skeleton fields */
            const span = i === 0 || i === rows - 1 ? 12 : 6
            return (
              <div
                key={i}
                className={cn(
                  'space-y-2',
                  span === 12 ? 'col-span-12' : 'col-span-12 sm:col-span-6',
                )}
              >
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StepBodySkeleton() {
  return (
    <div className="space-y-6">
      <PremiumCardSkeleton rows={5} />
      <PremiumCardSkeleton rows={4} />
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────── */

function StepEmptyStateView({ empty }: { empty: StepEmptyState }) {
  const Illustration = empty.illustration

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/30 bg-muted/20 py-16 text-center">
      {Illustration && (
        <div className="text-muted-foreground/25">
          <Illustration className="h-14 w-14" />
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{empty.title}</p>
        {empty.description && (
          <p className="max-w-xs text-sm text-muted-foreground">{empty.description}</p>
        )}
      </div>
      {empty.action && (
        <button
          type="button"
          onClick={empty.action.onClick}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          {empty.action.label}
        </button>
      )}
    </div>
  )
}

/* ─── FormStepCard ────────────────────────────────────────────────── */

interface FormStepCardProps {
  children: ReactNode
  headingRef: RefObject<HTMLHeadingElement | null>
  isLoading?: boolean
  className?: string
}

export function FormStepCard({
  children,
  headingRef,
  isLoading,
  className,
}: FormStepCardProps) {
  const { config, displayedStepIndex, animClass } = useFormFramework()
  const step = config.steps[displayedStepIndex]
  const hasChildren = Boolean(children)

  return (
    <div
      className={cn('will-change-[opacity,transform]', animClass, className)}
      data-slot="form-step-card-wrapper"
    >
      {/* Screen reader heading — announces the step to assistive technology */}
      {step && (
        <h2
          id="ff-step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="sr-only outline-none"
        >
          {step.title}
        </h2>
      )}

      {/* Helper text callout */}
      {step?.helperText && (
        <div className={cn(
          'mb-5 flex items-start gap-3 sm:mb-8',
          'rounded-2xl border border-primary/10 bg-primary/4',
          'px-5 py-4',
        )}>
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-primary/55"
            aria-hidden
          />
          <span className="flex-1 text-[13px] leading-relaxed text-foreground/70">
            {step.helperText}
          </span>
          {step.docsUrl && (
            <a
              href={step.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1 inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-primary underline-offset-2 hover:underline"
            >
              Learn more
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      )}

      {/* Step content */}
      <div aria-labelledby="ff-step-heading" data-slot="form-step-card">
        {isLoading ? (
          <StepBodySkeleton />
        ) : !hasChildren && step?.emptyState ? (
          <StepEmptyStateView empty={step.emptyState} />
        ) : (
          children
        )}
      </div>
    </div>
  )
}
