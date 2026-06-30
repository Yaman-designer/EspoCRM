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
  const isActive = status === 'current'

  const sizeClasses = size === 'md'
    ? isActive ? 'h-13 w-13 text-[13px]' : 'h-11 w-11 text-[12px]'
    : 'h-9 w-9 text-[11px]'

  const el = (
    <button
      type="button"
      ref={bubbleRef as any}
      onClick={isClickable ? onClick : undefined}
      aria-label={`${step.title}${step.optional ? ' (optional)' : ''} — ${status}`}
      aria-current={isActive ? 'step' : undefined}
      aria-disabled={!isClickable ? true : undefined}
      data-status={status}
      className={cn(
        'ff-step-bubble relative z-10 flex shrink-0 items-center justify-center rounded-full font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-all duration-200',
        sizeClasses,
        status === 'completed' && [
          'border-2 border-brand-emerald bg-brand-emerald text-white',
          isClickable && 'cursor-pointer hover:scale-105 hover:shadow-[0_0_0_5px_rgba(39,107,78,0.12)]',
        ],
        isActive && [
          'border-2 border-primary bg-primary text-white cursor-default',
          'shadow-[0_0_0_4px_rgba(0,97,188,0.12),0_0_0_2px_rgba(0,97,188,0.30),0_6px_20px_rgba(0,97,188,0.25)]',
        ],
        status === 'upcoming' && [
          'border-2 border-border/50 bg-card text-muted-foreground/35',
          isLocked ? 'cursor-not-allowed opacity-55' : 'cursor-default',
        ],
        status === 'error' && [
          'border-2 border-destructive/40 bg-destructive/8 text-destructive',
          isClickable && 'cursor-pointer hover:scale-105 hover:shadow-[0_0_0_4px_rgba(240,68,56,0.10)]',
        ],
        status === 'warning' && [
          'border-2 border-amber-300 bg-amber-50 text-amber-600',
          isClickable && 'cursor-pointer hover:scale-105',
        ],
      )}
    >
      {isLocked ? (
        <LockKeyhole className={cn('shrink-0', size === 'md' ? 'h-4 w-4' : 'h-3 w-3')} />
      ) : status === 'completed' ? (
        <Check className={cn('shrink-0', size === 'md' ? 'h-4.5 w-4.5' : 'h-3.5 w-3.5')} strokeWidth={2.5} />
      ) : status === 'error' ? (
        <AlertCircle className={cn('shrink-0', size === 'md' ? 'h-4.5 w-4.5' : 'h-3.5 w-3.5')} />
      ) : status === 'warning' ? (
        <AlertTriangle className={cn('shrink-0', size === 'md' ? 'h-4.5 w-4.5' : 'h-3.5 w-3.5')} />
      ) : Icon ? (
        <Icon className={cn('shrink-0', size === 'md' ? isActive ? 'h-5 w-5' : 'h-4.5 w-4.5' : 'h-3.5 w-3.5')} />
      ) : (
        <span>{index + 1}</span>
      )}
    </button>
  )

  if (!step.description) return el

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>{el}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={10}
        className="max-w-52 text-center text-xs leading-relaxed"
      >
        {step.description}
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── Connector line ─────────────────────────────────────────────── */

function StepConnector({ filled, partial }: { filled: boolean; partial?: boolean }) {
  return (
    <div className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-border/35" aria-hidden>
      <div
        className="ff-connector-fill absolute inset-y-0 left-0 h-full rounded-full bg-brand-emerald transition-[width] duration-500 ease-out"
        style={{ width: filled ? '100%' : partial ? '30%' : '0%' }}
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

  const scrollRef   = useRef<HTMLDivElement>(null)
  const tabletRef   = useRef<HTMLDivElement>(null)
  const bubbleRefs  = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const container = scrollRef.current
    const el = bubbleRefs.current[currentStepIndex]
    if (!container || !el) return
    const cw = container.clientWidth
    const left = (el as HTMLElement).offsetLeft
    const ew = (el as HTMLElement).offsetWidth
    container.scrollTo({ left: Math.max(0, left - (cw - ew) / 2), behavior: 'smooth' })
  }, [currentStepIndex])

  useEffect(() => {
    const container = tabletRef.current
    const el = bubbleRefs.current[currentStepIndex]
    if (!container || !el) return
    const cw = container.clientWidth
    const left = (el as HTMLElement).offsetLeft
    const ew = (el as HTMLElement).offsetWidth
    container.scrollTo({ left: Math.max(0, left - (cw - ew) / 2), behavior: 'smooth' })
  }, [currentStepIndex])

  const handleClick = (index: number) => {
    if (!isAnimating) goToStep(index)
  }

  const currentStep    = steps[currentStepIndex]
  const completionPct  = currentStep?.completion ?? 0
  const mobileProgress = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <TooltipProvider>
      {/* ARIA live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {`Step ${currentStepIndex + 1} of ${totalSteps}: ${currentStep?.title ?? ''}`}
      </div>

      <nav aria-label="Form progress" className="select-none">

        {/* ── Mobile: compact progress bar ──────────────── */}
        <div className="sm:hidden">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                'bg-primary text-white shadow-[0_0_0_3px_rgba(0,97,188,0.12),0_2px_6px_rgba(0,97,188,0.20)]',
              )}>
                {currentStepIndex + 1}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight text-foreground">
                  {currentStep?.title}
                </p>
                {currentStep?.description && (
                  <p className="mt-1 text-[10px] leading-tight text-muted-foreground/50 line-clamp-1">
                    {currentStep.description}
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/45">
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${mobileProgress}%` }}
            />
          </div>
        </div>

        {/* ── Tablet: compact scrollable bubbles ────────── */}
        <div className="hidden sm:block lg:hidden">
          <div
            ref={tabletRef}
            className="overflow-x-auto no-scrollbar"
          >
            <div className="flex min-w-max items-center gap-0 px-0.5 py-1">
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const isLast = index === steps.length - 1
                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      ref={el => { bubbleRefs.current[index] = el }}
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
                        'max-w-14 text-center text-[10px] font-medium leading-tight',
                        status === 'current'   && 'font-bold text-primary',
                        status === 'completed' && 'font-semibold text-brand-emerald',
                        status === 'warning'   && 'text-amber-600',
                        status === 'error'     && 'text-destructive',
                        status === 'upcoming'  && 'text-muted-foreground/40',
                      )}>
                        {step.title.length > 10 ? `${step.title.slice(0, 9)}…` : step.title}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="mx-2 w-8 shrink-0">
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

        {/* ── Desktop: full stepper + completion counter ── */}
        <div className="hidden lg:flex items-stretch" role="list" aria-label="Form steps">

          {/* Steps row */}
          <div
            ref={scrollRef}
            className="flex flex-1 items-start overflow-x-auto no-scrollbar"
          >
            <div className="flex min-w-max flex-1 items-start pb-0.5">
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const isLast = index === steps.length - 1
                const isActive = status === 'current'

                return (
                  <div
                    key={step.id}
                    role="listitem"
                    className={cn('flex items-start', isLast ? 'flex-none' : 'flex-1')}
                  >
                    {/* Step column */}
                    <div
                      ref={el => { bubbleRefs.current[index] = el }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      {/* Step number label */}
                      <span className={cn(
                        'text-[9.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-200',
                        isActive
                          ? 'text-primary/75'
                          : status === 'completed'
                          ? 'text-brand-emerald/50'
                          : 'text-muted-foreground/40',
                      )}>
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Bubble */}
                      <StepBubble
                        step={step}
                        index={index}
                        status={status}
                        size="md"
                        onClick={() => handleClick(index)}
                        bubbleRef={el => { bubbleRefs.current[index] = el }}
                      />

                      {/* Title + optional badge */}
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <span className={cn(
                          'block max-w-22 text-[12px] leading-tight transition-all duration-200',
                          isActive
                            ? 'font-bold text-primary'
                            : status === 'completed'
                            ? 'font-semibold text-brand-emerald'
                            : status === 'warning'
                            ? 'font-medium text-amber-600'
                            : status === 'error'
                            ? 'font-medium text-destructive'
                            : 'font-medium text-muted-foreground/40',
                        )}>
                          {step.title}
                        </span>
                        {step.optional && (
                          <span className="text-[9px] leading-none text-muted-foreground/30">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Connector */}
                    {!isLast && (
                      <div className="flex-1 pt-11">
                        <StepConnector
                          filled={status === 'completed'}
                          partial={isActive}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Completion counter ───────────────── */}
          <div className="ml-5 flex shrink-0 flex-col items-end justify-center gap-1 border-l border-border/15 pl-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/30">
              Progress
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[20px] font-bold leading-none tabular-nums text-primary">
                {completionPct}
              </span>
              <span className="text-[12px] font-bold text-primary/65">%</span>
            </div>
            <span className="text-[10.5px] font-medium text-muted-foreground/50">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            {currentStep?.estTime && (
              <span className="text-[10px] text-muted-foreground/40">
                ~{currentStep.estTime} left
              </span>
            )}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
