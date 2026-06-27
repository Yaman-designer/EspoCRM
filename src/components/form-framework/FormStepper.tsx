'use client'

import { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  Check,
  AlertCircle,
  LockKeyhole,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useFormFramework } from './context'
import type { StepConfig, StepStatus } from './types'

/* ─── Step bubble ────────────────────────────────────────────────── */

interface StepBubbleProps {
  step: StepConfig
  index: number
  status: StepStatus
  size?: 'md' | 'sm'
  onClick: () => void
  bubbleRef?: (el: HTMLElement | null) => void
}

function StepBubble({ step, index, status, size = 'md', onClick, bubbleRef }: StepBubbleProps) {
  const Icon = step.icon
  const isClickable = (status === 'completed' || status === 'error' || status === 'warning')
    && !step.locked
  const isLocked = step.locked && status === 'upcoming'

  const sizeClasses = size === 'md'
    ? 'h-10 w-10 text-sm'
    : 'h-8 w-8 text-xs'

  const el = (
    <button
      type="button"
      ref={bubbleRef as any}
      onClick={isClickable ? onClick : undefined}
      aria-label={`${step.title}${step.optional ? ' (optional)' : ''} — ${status}`}
      aria-current={status === 'current' ? 'step' : undefined}
      aria-disabled={!isClickable ? true : undefined}
      className={cn(
        'ff-step-bubble relative z-10 flex shrink-0 items-center justify-center rounded-full font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        sizeClasses,
        /* Completed */
        status === 'completed' && [
          'bg-brand-emerald border-2 border-brand-emerald text-white',
          isClickable && 'cursor-pointer hover:scale-105 hover:shadow-[0_0_0_4px_rgba(39,107,78,0.12)]',
        ],
        /* Current */
        status === 'current' && [
          'bg-primary border-2 border-primary text-white cursor-default',
          'shadow-[0_0_0_4px_rgba(0,97,188,0.14),0_2px_8px_rgba(0,97,188,0.25)]',
        ],
        /* Upcoming / locked */
        status === 'upcoming' && [
          'border-2 border-border bg-card text-muted-foreground',
          isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-default',
        ],
        /* Error */
        status === 'error' && [
          'bg-destructive/8 border-2 border-destructive/40 text-destructive',
          isClickable && 'cursor-pointer hover:scale-105 hover:shadow-[0_0_0_4px_rgba(240,68,56,0.10)]',
        ],
        /* Warning */
        status === 'warning' && [
          'bg-amber-50 border-2 border-amber-300 text-amber-600',
          isClickable && 'cursor-pointer hover:scale-105',
        ],
      )}
    >
      {isLocked ? (
        <LockKeyhole className={cn('shrink-0', size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3')} />
      ) : status === 'completed' ? (
        <Check className={cn('shrink-0', size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5')} strokeWidth={2.5} />
      ) : status === 'error' ? (
        <AlertCircle className={cn('shrink-0', size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
      ) : status === 'warning' ? (
        <AlertTriangle className={cn('shrink-0', size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
      ) : Icon ? (
        <Icon className={cn('shrink-0', size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
      ) : (
        <span>{index + 1}</span>
      )}
    </button>
  )

  /* Wrap in tooltip only if there's a description */
  if (!step.description) return el

  return (
    <Tooltip delayDuration={350}>
      <TooltipTrigger asChild>{el}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="max-w-[200px] text-center text-xs leading-relaxed"
      >
        {step.description}
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── Connector line ─────────────────────────────────────────────── */

function StepConnector({ filled, partial }: { filled: boolean; partial?: boolean }) {
  return (
    <div className="relative mx-2 h-px flex-1 overflow-hidden rounded-full bg-border" aria-hidden>
      <div
        className="ff-connector-fill absolute inset-y-0 left-0 h-full rounded-full bg-brand-emerald"
        style={{ width: filled ? '100%' : partial ? '45%' : '0%' }}
      />
    </div>
  )
}

/* ─── Main stepper ───────────────────────────────────────────────── */

export function FormStepper() {
  const {
    config,
    currentStepIndex,
    getStepStatus,
    goToStep,
    isAnimating,
    totalSteps,
  } = useFormFramework()
  const { steps } = config

  /* Refs for scroll-into-view on active step */
  const scrollRef = useRef<HTMLDivElement>(null)
  const stepBubbleRefs = useRef<(HTMLElement | null)[]>([])

  /* Auto-scroll active step into view when index changes */
  useEffect(() => {
    const container = scrollRef.current
    const activeEl = stepBubbleRefs.current[currentStepIndex]
    if (!container || !activeEl) return

    const containerW = container.clientWidth
    const elOffset = (activeEl as HTMLElement).offsetLeft
    const elW = (activeEl as HTMLElement).offsetWidth
    const targetLeft = elOffset - (containerW - elW) / 2

    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
  }, [currentStepIndex])

  const handleClick = (index: number) => {
    if (!isAnimating) goToStep(index)
  }

  /* Mobile progress (< sm) */
  const mobileProgress = ((currentStepIndex + 1) / totalSteps) * 100
  const currentStep = steps[currentStepIndex]

  return (
    <TooltipProvider>
      {/* ── ARIA live region for screen readers ── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`Step ${currentStepIndex + 1} of ${totalSteps}: ${currentStep?.title ?? ''}`}
      </div>

      <nav aria-label="Form progress" className="select-none">

        {/* ── Mobile (< sm): text bar ───────────────────────────── */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              {/* Mini bubble */}
              <div className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                'bg-primary text-white shadow-[0_0_0_3px_rgba(0,97,188,0.14)]',
              )}>
                {currentStepIndex + 1}
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight text-foreground">
                  {currentStep?.title}
                </p>
                {currentStep?.description && (
                  <p className="text-[10px] leading-tight text-muted-foreground line-clamp-1">
                    {currentStep.description}
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="ff-mobile-progress h-full rounded-full bg-primary"
              style={{ width: `${mobileProgress}%` }}
            />
          </div>
        </div>

        {/* ── Tablet (sm–lg): compact scrollable bubbles ─────────── */}
        <div className="hidden sm:block lg:hidden">
          <div
            ref={scrollRef}
            className={cn(
              'overflow-x-auto no-scrollbar',
              steps.length > 6 && 'ff-stepper-mask',
            )}
          >
            <div className="flex min-w-max items-center px-1 py-0.5">
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const isLast = index === steps.length - 1
                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      ref={el => { stepBubbleRefs.current[index] = el }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <StepBubble
                        step={step}
                        index={index}
                        status={status}
                        size="sm"
                        onClick={() => handleClick(index)}
                      />
                      <span className={cn(
                        'ff-step-label text-[10px] font-medium leading-none',
                        status === 'current'   && 'font-semibold text-primary',
                        status === 'completed' && 'text-brand-emerald',
                        status === 'warning'   && 'text-amber-600',
                        status === 'error'     && 'text-destructive',
                        status === 'upcoming'  && 'text-muted-foreground',
                      )}>
                        {step.title.length > 10 ? `${step.title.slice(0, 9)}…` : step.title}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="mx-1.5 flex-shrink-0 w-8">
                        <StepConnector
                          filled={status === 'completed'}
                          partial={status === 'current'}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Desktop (lg+): full labels, scrollable for 8–15 steps ── */}
        <div
          className="hidden lg:block"
          role="list"
          aria-label="Form steps"
        >
          <div
            ref={scrollRef}
            className={cn(
              'overflow-x-auto no-scrollbar',
              steps.length > 5 && 'ff-stepper-mask',
            )}
          >
            <div className="flex min-w-max items-start px-1 pb-0.5 pt-0.5">
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const isLast = index === steps.length - 1

                return (
                  <div
                    key={step.id}
                    role="listitem"
                    className={cn(
                      'flex items-start',
                      isLast ? 'flex-none' : 'flex-1',
                    )}
                  >
                    {/* Step column */}
                    <div
                      ref={el => { stepBubbleRefs.current[index] = el }}
                      className="flex flex-col items-center gap-2.5"
                    >
                      <StepBubble
                        step={step}
                        index={index}
                        status={status}
                        size="md"
                        onClick={() => handleClick(index)}
                      />

                      {/* Step labels */}
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <span className={cn(
                          'ff-step-label block max-w-[90px] text-xs font-medium leading-tight',
                          status === 'current'   && 'font-semibold text-primary',
                          status === 'completed' && 'text-brand-emerald',
                          status === 'warning'   && 'text-amber-600',
                          status === 'error'     && 'text-destructive',
                          status === 'upcoming'  && 'text-muted-foreground',
                        )}>
                          {step.title}
                        </span>
                        {step.optional && (
                          <span className="text-[10px] leading-none text-muted-foreground/50">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Connector */}
                    {!isLast && (
                      <div className="flex-1 pt-[18px]">
                        <StepConnector
                          filled={status === 'completed'}
                          partial={status === 'current'}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
