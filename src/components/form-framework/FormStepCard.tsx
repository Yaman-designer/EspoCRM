'use client'

import { type RefObject, type ReactNode } from 'react'
import { ExternalLink, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormFramework } from './context'
import type { StepEmptyState } from './types'

/* ─── Step loading skeleton (inside card body) ───────────────────── */

function StepBodySkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Empty state (inside card body) ─────────────────────────────── */

function StepEmptyStateView({ empty }: { empty: StepEmptyState }) {
  const Illustration = empty.illustration

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      {Illustration && (
        <div className="text-muted-foreground/30">
          <Illustration className="h-16 w-16" />
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">{empty.title}</p>
        {empty.description && (
          <p className="text-sm text-muted-foreground max-w-xs">{empty.description}</p>
        )}
      </div>
      {empty.action && (
        <button
          type="button"
          onClick={empty.action.onClick}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          {empty.action.label}
        </button>
      )}
    </div>
  )
}

/* ─── Main FormStepCard ───────────────────────────────────────────── */

interface FormStepCardProps {
  children: ReactNode
  headingRef: RefObject<HTMLHeadingElement | null>
  /** Show body skeleton instead of children */
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
  const StepIcon = step?.icon
  const hasChildren = Boolean(children)

  return (
    <div
      className={cn('will-change-[opacity,transform]', animClass, className)}
      data-slot="form-step-card-wrapper"
    >
      <article
        className="overflow-hidden rounded-[28px] border border-border bg-card shadow-design-md"
        aria-labelledby="ff-step-heading"
        data-slot="form-step-card"
      >
        {/* ── Card header ─────────────────────────────────────── */}
        {step && (
          <div className="border-b border-border px-8 py-6">
            <div className="flex items-start gap-4">

              {/* Step icon */}
              {StepIcon && (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10"
                  aria-hidden
                >
                  <StepIcon className="h-5 w-5" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                {/* Step title — focusable for screen-reader announcement */}
                <h2
                  id="ff-step-heading"
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-[17px] font-semibold tracking-tight text-foreground outline-none"
                >
                  {step.title}
                </h2>

                {/* Step description */}
                {step.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                )}

                {/* Helper text callout */}
                {step.helperText && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/60 px-3.5 py-2.5 text-xs text-foreground/70 ring-1 ring-primary/8">
                    <Info
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/50"
                      aria-hidden
                    />
                    <span className="flex-1 leading-relaxed">{step.helperText}</span>
                    {step.docsUrl && (
                      <a
                        href={step.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 shrink-0 font-medium text-primary hover:underline underline-offset-2 inline-flex items-center gap-0.5"
                      >
                        Learn more
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Card body ───────────────────────────────────────── */}
        <div className="px-8 py-8">
          {isLoading ? (
            <StepBodySkeleton />
          ) : !hasChildren && step?.emptyState ? (
            <StepEmptyStateView empty={step.emptyState} />
          ) : (
            children
          )}
        </div>
      </article>
    </div>
  )
}
