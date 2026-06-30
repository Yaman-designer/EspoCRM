'use client'

import { ArrowRight, Check, ChevronLeft, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFormFramework } from './context'
import type { FormFrameworkPlugin } from './types'

interface FormActionBarProps {
  submitLabel?: string
  onSubmit?: () => void
  onCancel?: () => void
  plugins?: FormFrameworkPlugin[]
  className?: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function FormActionBar({
  submitLabel,
  onSubmit,
  onCancel,
  plugins = [],
  className,
}: FormActionBarProps) {
  const ctx = useFormFramework()
  const {
    config,
    currentStepIndex,
    totalSteps,
    isAnimating,
    isSubmitting,
    isSubmitSuccess,
    saveState,
    goNext,
    goPrevious,
  } = ctx

  const isFirstStep = currentStepIndex === 0
  const isLastStep  = currentStepIndex === totalSteps - 1
  const disabled    = isAnimating || isSubmitting || isSubmitSuccess

  const phaseTotal    = config.totalPhasesCount ?? totalSteps
  const phaseProgress = ((currentStepIndex + 1) / phaseTotal) * 100

  const currentStep   = config.steps[currentStepIndex]
  const requiredCount = currentStep?.requiredCount

  const nextStep = config.steps[currentStepIndex + 1]
  const ctaLabel = submitLabel
    ?? (isLastStep
      ? (config.submitLabel ?? `Create ${config.entityLabel ?? 'Record'}`)
      : `Continue to ${nextStep?.title ?? 'Next'}`)

  const isSyncing    = saveState.status === 'saving' || saveState.status === 'saving_draft'
  const isSynced     = saveState.status === 'saved'  || saveState.status === 'autosaved'
  const hasSyncError = saveState.status === 'failed'

  const pluginAddons = plugins.map(p => p.renderActionBarAddon?.(ctx)).filter(Boolean)

  /* ── Shared CTA content ──────────────────────────────────────────── */

  const lastStepContent = isSubmitting ? (
    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Saving…</>
  ) : isSubmitSuccess ? (
    <><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />Saved!</>
  ) : (
    <><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />{ctaLabel}</>
  )

  const continueContent = (
    <>
      {isAnimating && !isSubmitting
        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        : null}
      {ctaLabel}
      {!isAnimating && <ArrowRight className="h-4 w-4" aria-hidden />}
    </>
  )

  return (
    <div
      className={cn('sticky bottom-0 z-30 px-3 pb-2 sm:px-4 sm:pb-4 sm:pt-2', className)}
      data-slot="form-action-bar"
    >
      <div
        className={cn(
          'overflow-hidden rounded-3xl border border-border/10 sm:rounded-2xl sm:border-border/40',
          'bg-background/93 sm:bg-background/97 backdrop-blur-2xl',
          'shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-4px_12px_rgba(16,24,40,0.07),0_-20px_48px_rgba(16,24,40,0.08),0_0_0_0.5px_rgba(0,0,0,0.03)]',
          'sm:shadow-[0_-2px_20px_rgba(16,24,40,0.07),0_4px_24px_rgba(16,24,40,0.10)]',
        )}
      >

        {/* ══════════════════════════════════════════════════════════════
            Mobile command bar  < 640px

            A single flex-col panel. Height comes from content + gap.
            No separator. No sections. One unified block.

            Row A  [Discard Draft ·············· ← Previous]
            Row B  [═══════════ Continue ═══════════════════]

            Both rows live inside px-5 → CTA gets equal side margins.
            The gap-4 between rows is the only vertical rhythm device.
        ═════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 pt-3.5 sm:hidden">

          {/* Row A — escape left, back right */}
          <div className="flex items-center px-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className={cn(
                'flex h-8 items-center text-[11px] font-normal text-muted-foreground/30',
                'transition-colors duration-200 hover:text-muted-foreground/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-30',
              )}
            >
              Discard Draft
            </button>

            {pluginAddons.length > 0 && (
              <div className="ml-3 flex items-center gap-2">
                {pluginAddons.map((addon, i) => <span key={i}>{addon}</span>)}
              </div>
            )}

            <div className="flex-1" aria-hidden />

            {/* Previous — outlined square icon; invisible on step 1 so Row A height stays stable */}
            <button
              type="button"
              onClick={() => goPrevious()}
              disabled={isFirstStep || disabled}
              aria-label="Go to previous step"
              aria-hidden={isFirstStep || undefined}
              className={cn(
                'flex h-10 w-10 -my-1.5 shrink-0 items-center justify-center rounded-xl',
                'text-muted-foreground/30',
                'transition-colors duration-200 hover:text-muted-foreground/55',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none',
                isFirstStep && 'invisible pointer-events-none',
              )}
            >
              <ChevronLeft className="h-3.75 w-3.75" aria-hidden />
            </button>
          </div>

          {/* Row B — full-width primary CTA; margins are the px-5 from the parent */}
          {isLastStep ? (
            <Button
              type="button"
              variant="default"
              onClick={onSubmit}
              disabled={disabled}
              className={cn(
                'h-13 self-center w-[83%] rounded-2xl text-[13.5px] font-semibold tracking-[0.01em]',
                'shadow-[0_1px_3px_rgba(0,0,0,0.10),0_4px_14px_rgba(0,97,188,0.28),0_12px_28px_rgba(0,97,188,0.14)]',
                'hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),0_6px_18px_rgba(0,97,188,0.34),0_18px_40px_rgba(0,97,188,0.18)]',
                'transition-all duration-200',
                isSubmitSuccess && 'ff-success-pulse bg-brand-emerald border-brand-emerald hover:bg-brand-emerald/90',
              )}
              aria-label={isSubmitting ? 'Saving…' : isSubmitSuccess ? 'Saved' : ctaLabel}
            >
              {lastStepContent}
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              onClick={() => goNext()}
              disabled={disabled}
              className={cn(
                'h-13 self-center w-[83%] rounded-2xl text-[13.5px] font-semibold tracking-[0.01em]',
                'shadow-[0_1px_3px_rgba(0,0,0,0.10),0_4px_14px_rgba(0,97,188,0.28),0_12px_28px_rgba(0,97,188,0.14)]',
                'hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),0_6px_18px_rgba(0,97,188,0.34),0_18px_40px_rgba(0,97,188,0.18)]',
                'transition-all duration-200',
              )}
              aria-label="Continue to next step"
            >
              {continueContent}
            </Button>
          )}

          {/* Safe area — iOS home indicator / Android gesture bar */}
          <div style={{ height: 'max(0.75rem, env(safe-area-inset-bottom))' }} aria-hidden />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            Desktop  ≥ 640px  — three-zone composition

            Both outer zones are flex-1 → center is mathematically
            anchored regardless of asymmetric content widths.

            ┌──────────────┬──────────────────────────┬──────────────────┐
            │  Discard     │  ╔ Save · Track · Phase ╗ │  [← Prev] [CTA] │
            │  flex-1      │  ╚═ visual anchor ══════╝ │  flex-1 end      │
            └──────────────┴──────────────────────────┴──────────────────┘

            Center: framed pill (bg + border) → draws the eye first.
            Right: Previous + CTA both h-10, Previous bordered → they
            read as a matched navigation cluster, not two orphan buttons.
        ═════════════════════════════════════════════════════════════ */}
        <div className="mx-auto hidden max-w-6xl items-center px-5 py-3.5 sm:flex">

          {/* ── Left zone — escape hatch, deliberately de-emphasised ── */}
          <div className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[12px] font-medium',
                'text-muted-foreground/40 transition-colors duration-200',
                'hover:bg-muted/50 hover:text-muted-foreground/65',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              Discard Draft
            </button>
            {pluginAddons.map((addon, i) => <span key={i}>{addon}</span>)}
          </div>

          {/* ── Center zone — framed status pill; the visual anchor ── */}
          <div className={cn(
            'flex shrink-0 items-center gap-3',
            'rounded-2xl border border-border/18 bg-muted/22 px-4 py-2',
          )}>

            {/* Auto-save indicator */}
            <div className="flex items-center gap-1.5" aria-live="polite">
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary/50" aria-hidden />
              ) : hasSyncError ? (
                <CloudOff className="h-3 w-3 text-destructive/55" aria-hidden />
              ) : (
                <Cloud
                  className={cn(
                    'h-3 w-3 transition-colors duration-300',
                    isSynced ? 'text-brand-emerald/70' : 'text-muted-foreground/30',
                  )}
                  aria-hidden
                />
              )}
              <span className={cn(
                'text-[9.5px] font-bold uppercase tracking-widest',
                hasSyncError ? 'text-destructive/60'
                : isSynced   ? 'text-brand-emerald/60'
                             : 'text-muted-foreground/35',
              )}>
                {isSyncing ? 'Saving…' : hasSyncError ? 'Sync Failed' : isSynced ? 'Saved' : 'Auto-save'}
              </span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                  hasSyncError ? 'bg-destructive/60'
                  : isSynced   ? 'bg-brand-emerald/70'
                  : isSyncing  ? 'animate-pulse bg-primary/60'
                               : 'bg-muted-foreground/25',
                )}
                aria-hidden
              />
            </div>

            <span className="h-3 w-px shrink-0 bg-border/30" aria-hidden />

            {/* Progress track */}
            <div
              className="h-0.75 w-20 overflow-hidden rounded-full bg-border/35"
              role="progressbar"
              aria-valuenow={Math.round(phaseProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Form completion"
            >
              <div
                className="h-full rounded-full bg-primary/65 transition-[width] duration-700 ease-out"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>

            <span className="h-3 w-px shrink-0 bg-border/30" aria-hidden />

            {/* Phase counter */}
            <div className="flex items-center gap-2">
              <span
                className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground/45"
                aria-label={`Phase ${currentStepIndex + 1} of ${phaseTotal}`}
              >
                {`PHASE ${pad2(currentStepIndex + 1)} / ${pad2(phaseTotal)}`}
              </span>
              {requiredCount !== undefined && requiredCount > 0 && (
                <>
                  <span className="h-3 w-px shrink-0 bg-border/30" aria-hidden />
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    {requiredCount} required
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Right zone — navigation cluster, both buttons h-10 ── */}
          <div className="flex flex-1 items-center justify-end gap-2">

            {/* Previous — bordered to pair visually with the filled CTA */}
            <button
              type="button"
              onClick={() => goPrevious()}
              disabled={isFirstStep || disabled}
              aria-label="Go to previous step"
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-xl px-4',
                'border border-border/35 text-[12.5px] font-medium text-foreground/55',
                'transition-all duration-200',
                'hover:border-border/55 hover:bg-muted/40 hover:text-foreground/85',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Previous
            </button>

            {isLastStep ? (
              <Button
                type="button"
                variant="default"
                onClick={onSubmit}
                disabled={disabled}
                className={cn(
                  'h-10 rounded-xl px-5 text-[13px] font-semibold',
                  'shadow-[0_1px_4px_rgba(0,97,188,0.22),0_4px_16px_rgba(0,97,188,0.20)]',
                  'hover:shadow-[0_2px_8px_rgba(0,97,188,0.30),0_6px_20px_rgba(0,97,188,0.28)]',
                  'transition-all duration-200',
                  isSubmitSuccess && 'ff-success-pulse bg-brand-emerald border-brand-emerald hover:bg-brand-emerald/90',
                )}
                aria-label={isSubmitting ? 'Saving…' : isSubmitSuccess ? 'Saved' : ctaLabel}
              >
                {lastStepContent}
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={() => goNext()}
                disabled={disabled}
                className={cn(
                  'h-10 rounded-xl px-5 text-[13px] font-semibold',
                  'shadow-[0_1px_4px_rgba(0,97,188,0.22),0_4px_16px_rgba(0,97,188,0.20)]',
                  'hover:shadow-[0_2px_8px_rgba(0,97,188,0.30),0_6px_20px_rgba(0,97,188,0.28)]',
                  'transition-all duration-200',
                )}
                aria-label="Continue to next step"
              >
                {continueContent}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
