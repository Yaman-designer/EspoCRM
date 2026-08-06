'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  bubbleRef?: (el: HTMLButtonElement | null) => void
}

function StepBubble({ step, index, status, size = 'md', onClick, bubbleRef }: StepBubbleProps) {
  const { t } = useTranslation('common')
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
      ref={bubbleRef}
      onClick={isClickable ? onClick : undefined}
      aria-label={`${step.title}${step.optional ? ` ${t('formFramework.stepper.optionalSuffix')}` : ''} — ${status}`}
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
          'border-2 border-border/50 bg-card text-muted-foreground/45',
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

/* ─── Horizontal wheel-scroll ─────────────────────────────────────
   Lets a plain vertical mouse wheel drive the horizontal step rail —
   the same affordance Linear/Stripe/GitHub use on their own scroll rails.
   Needs a native (non-passive) listener: React's JSX onWheel prop is
   passive, so preventDefault() inside it is silently ignored and the
   page would scroll vertically underneath the rail at the same time. ── */
function useHorizontalWheelScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return
      el.scrollLeft += e.deltaY
      e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ref])
}

/* ─── Edge fade indicators ──────────────────────────────────────
   Only relevant to the compact rail (the full/desktop rail isn't asked
   for this treatment). Tracks whether there's more rail past either
   edge so the caller can fade that edge in/out — recomputed on scroll,
   and on resize of either the viewport (scrollEl) or the content it
   scrolls (contentEl grows/shrinks independently, e.g. locale swaps
   changing label widths), so a step added/removed or a width change
   can't leave a stale fade showing on a rail that no longer overflows. ── */
function useEdgeFade(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>,
) {
  const [fade, setFade] = useState({ start: false, end: false })

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const measure = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollEl
      const overflowing = scrollWidth > clientWidth + 1
      setFade({
        start: overflowing && scrollLeft > 1,
        end: overflowing && scrollLeft < scrollWidth - clientWidth - 1,
      })
    }

    measure()
    scrollEl.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(scrollEl)
    if (contentRef.current) ro.observe(contentRef.current)

    return () => {
      scrollEl.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [scrollRef, contentRef])

  return fade
}

/* ─── Auto-scroll active step into view, centered ─────────────────── */
function useActiveStepAutoScroll(
  containerRef: React.RefObject<HTMLDivElement | null>,
  bubbleRefs: React.RefObject<(HTMLElement | null)[]>,
  currentStepIndex: number,
) {
  useEffect(() => {
    const container = containerRef.current
    const el = bubbleRefs.current[currentStepIndex]
    if (!container || !el) return
    const cw = container.clientWidth
    const left = el.offsetLeft
    const ew = el.offsetWidth
    container.scrollTo({ left: Math.max(0, left - (cw - ew) / 2), behavior: 'smooth' })
  }, [containerRef, bubbleRefs, currentStepIndex])
}

/* ─── Main stepper ───────────────────────────────────────────────── */

export function FormStepper() {
  const { t } = useTranslation('common')
  const {
    config,
    currentStepIndex,
    getStepStatus,
    goToStep,
    isAnimating,
    totalSteps,
    progressPercent,
  } = useFormFramework()
  const { steps } = config

  /* Two independent rails (compact <lg, full ≥lg) get their own scroll
     container + bubble-ref array. Both variants are mounted at once
     (toggled with `hidden` / `lg:hidden`, not conditional rendering) so
     that switching breakpoints never triggers a remount/flash — sharing
     one bubble-ref array between them would let whichever rail mounts
     later silently steal the other's ref slots and break its
     auto-scroll math, so each rail must keep its own. */
  const compactScrollRef  = useRef<HTMLDivElement>(null)
  const compactContentRef = useRef<HTMLDivElement>(null)
  const compactBubbleRefs = useRef<(HTMLElement | null)[]>([])
  const desktopScrollRef  = useRef<HTMLDivElement>(null)
  const desktopBubbleRefs = useRef<(HTMLElement | null)[]>([])

  useActiveStepAutoScroll(compactScrollRef, compactBubbleRefs, currentStepIndex)
  useActiveStepAutoScroll(desktopScrollRef, desktopBubbleRefs, currentStepIndex)
  useHorizontalWheelScroll(compactScrollRef)
  useHorizontalWheelScroll(desktopScrollRef)
  const compactFade = useEdgeFade(compactScrollRef, compactContentRef)

  const handleClick = (index: number) => {
    if (!isAnimating) goToStep(index)
  }

  const currentStep = steps[currentStepIndex]
  // Reads the framework's one canonical progress value (context.tsx) —
  // this used to look up a hand-authored `step.completion` field that
  // wasn't kept in sync with the footer's own independently-computed
  // percentage, which is exactly how the header and footer ended up
  // disagreeing. That field has been retired; every surface derives from
  // the same number now.
  const completionPct = Math.round(progressPercent)

  return (
    <TooltipProvider>
      {/* ARIA live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {t('formFramework.stepper.stepStatusAnnounce', { current: currentStepIndex + 1, total: totalSteps, title: currentStep?.title ?? '' })}
      </div>

      <nav aria-label={t('formFramework.stepper.formProgress')} className="select-none">

        {/* ── Compact rail: mobile + tablet, one scrollable row, every step reachable ── */}
        <div className="lg:hidden">
          <div className="relative">
            <div
              ref={compactScrollRef}
              className="ff-scroll-x snap-x snap-proximity overflow-x-auto no-scrollbar"
            >
              <div
                ref={compactContentRef}
                className="flex min-w-max items-start gap-0 px-0.5 py-1"
                role="list"
                aria-label={t('formFramework.stepper.formSteps')}
              >
                {steps.map((step, index) => {
                  const status = getStepStatus(index)
                  const isLast = index === steps.length - 1
                  return (
                    <div key={step.id} role="listitem" className="flex items-start">
                      <div className="snap-center flex flex-col items-center gap-1">
                        <span className={cn(
                          'text-[8.5px] font-bold uppercase tracking-[0.12em]',
                          status === 'current'
                            ? 'text-primary/75'
                            : status === 'completed'
                            ? 'text-brand-emerald/50'
                            : 'text-muted-foreground/45',
                        )}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <StepBubble
                          step={step}
                          index={index}
                          status={status}
                          size="sm"
                          onClick={() => handleClick(index)}
                          bubbleRef={el => { compactBubbleRefs.current[index] = el }}
                        />
                        <span
                          title={step.title}
                          className={cn(
                            // CSS truncate, not a hardcoded character slice —
                            // a fixed char count truncates unevenly across
                            // scripts/locales (e.g. Greek diacritics render
                            // wider per character than this was tuned for).
                            'block max-w-14 truncate text-center text-[10px] font-medium leading-tight',
                            status === 'current'   && 'font-bold text-primary',
                            status === 'completed' && 'font-semibold text-brand-emerald',
                            status === 'warning'   && 'text-amber-600',
                            status === 'error'     && 'text-destructive',
                            status === 'upcoming'  && 'text-muted-foreground/50',
                          )}
                        >
                          {step.title}
                        </span>
                      </div>
                      {!isLast && (
                        <div className="mx-2 w-8 shrink-0 pt-4.5">
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

            {/* Edge fade indicators — subtle "there's more this way" hint,
                only rendered while the rail actually overflows on that
                side; fades itself out once the user reaches that edge. */}
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 z-20 w-6',
                'bg-linear-to-r from-background to-transparent',
                'transition-opacity duration-200',
                compactFade.start ? 'opacity-100' : 'opacity-0',
              )}
            />
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 right-0 z-20 w-6',
                'bg-linear-to-l from-background to-transparent',
                'transition-opacity duration-200',
                compactFade.end ? 'opacity-100' : 'opacity-0',
              )}
            />
          </div>

          {/* Progress summary — moves below the rail on compact widths so it
              can never overlap or squeeze the step row (see desktop's side
              counter, which serves the same purpose at ≥lg). */}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/15 pt-2">
            <span className="text-[11px] font-semibold text-muted-foreground/60">
              {t('formFramework.stepper.stepOfTotal', { current: currentStepIndex + 1, total: totalSteps })}
            </span>
            <div className="flex items-center gap-2">
              {currentStep?.estTime && (
                <span className="text-[10px] text-muted-foreground/40">
                  {t('formFramework.stepper.timeLeft', { time: currentStep.estTime })}
                </span>
              )}
              <span className="text-[11px] font-bold tabular-nums text-primary">
                {completionPct}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Full rail: laptop + desktop, large bubbles + completion counter ── */}
        <div className="hidden lg:flex items-stretch">

          {/* Steps row */}
          <div
            ref={desktopScrollRef}
            className="ff-scroll-x flex flex-1 items-start overflow-x-auto no-scrollbar"
          >
            <div
              className="flex min-w-max flex-1 items-start pb-0.5"
              role="list"
              aria-label={t('formFramework.stepper.formSteps')}
            >
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
                    <div className="flex flex-col items-center gap-1.5">
                      {/* Step number label */}
                      <span className={cn(
                        'text-[9.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-200',
                        isActive
                          ? 'text-primary/75'
                          : status === 'completed'
                          ? 'text-brand-emerald/50'
                          : 'text-muted-foreground/50',
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
                        bubbleRef={el => { desktopBubbleRefs.current[index] = el }}
                      />

                      {/* Title + optional badge */}
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <span
                          title={step.title}
                          className={cn(
                            // line-clamp-2, not unbounded wrap: at 88px-wide
                            // columns the longest titles (e.g. "Outdoor,
                            // Building & Amenities") would otherwise wrap to
                            // 3-4 lines, making the 8-step row uneven and
                            // hard to scan. Widened slightly (max-w-22 →
                            // max-w-26) so 2 lines is usually the full title,
                            // not a truncation — `title` covers the rest.
                            // text-balance: the browser's default wrap
                            // greedily fills line 1 first, which can strand
                            // a lone short word ("Governance") alone on
                            // line 2 — balance spreads the break point more
                            // evenly instead.
                            'block max-w-26 text-[12px] leading-tight text-balance transition-all duration-200',
                            'line-clamp-2',
                            isActive
                              ? 'font-bold text-primary'
                              : status === 'completed'
                              ? 'font-semibold text-brand-emerald'
                              : status === 'warning'
                              ? 'font-medium text-amber-600'
                              : status === 'error'
                              ? 'font-medium text-destructive'
                              : 'font-medium text-muted-foreground/50',
                          )}
                        >
                          {step.title}
                        </span>
                        {step.optional && (
                          <span className="text-[9px] leading-none text-muted-foreground/30">
                            {t('formFramework.stepper.optionalBadge')}
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
              {t('formFramework.stepper.progress')}
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[20px] font-bold leading-none tabular-nums text-primary">
                {completionPct}
              </span>
              <span className="text-[12px] font-bold text-primary/65">%</span>
            </div>
            <span className="text-[10.5px] font-medium text-muted-foreground/50">
              {t('formFramework.stepper.stepOfTotal', { current: currentStepIndex + 1, total: totalSteps })}
            </span>
            {currentStep?.estTime && (
              <span className="text-[10px] text-muted-foreground/40">
                {t('formFramework.stepper.timeLeft', { time: currentStep.estTime })}
              </span>
            )}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
