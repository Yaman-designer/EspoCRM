'use client'

import {
  CheckCircle2,
  Clock,
  CloudOff,
  FileEdit,
  ListChecks,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormFramework } from './context'

export function FormPageHeader({ className }: { className?: string }) {
  const { config, currentStepIndex, totalSteps, saveState } = useFormFramework()
  const step = config.steps[currentStepIndex]
  if (!step) return null

  const heading    = step.displayTitle ?? step.title
  const subtitle   = step.description
  const required   = step.requiredCount
  const estTime    = step.estTime
  const completion = step.completion

  const stepNum = String(currentStepIndex + 1).padStart(2, '0')
  const stepTag = `STEP ${stepNum} OF ${String(totalSteps).padStart(2, '0')}`

  /* ── Save state chip ── */
  const isSaving      = saveState.status === 'saving' || saveState.status === 'saving_draft'
  const isSaved       = saveState.status === 'saved'  || saveState.status === 'autosaved'
  const hasSaveError  = saveState.status === 'failed'

  const SaveIcon = isSaving
    ? Loader2
    : isSaved
    ? CheckCircle2
    : hasSaveError
    ? CloudOff
    : FileEdit

  const saveLabel = isSaving
    ? 'Saving…'
    : isSaved
    ? 'Saved'
    : hasSaveError
    ? 'Sync Failed'
    : 'Draft'

  const saveCls = isSaved
    ? 'border-brand-emerald/25 bg-brand-emerald-soft/50 text-brand-emerald'
    : hasSaveError
    ? 'border-destructive/20 bg-destructive/5 text-destructive'
    : 'border-border/50 bg-muted/60 text-muted-foreground/55'

  return (
    <header
      className={cn('border-b border-border/20 bg-background px-5 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-4', className)}
      aria-label="Step summary"
    >
      <div className="mx-auto max-w-6xl">

        {/* ── Eyebrow: step tag + save badge ── */}
        <div className="mb-2 flex items-center gap-2.5 sm:mb-2.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
            {stepTag}
          </span>

          <span className="h-3 w-px bg-border/40" aria-hidden />

          {/* Save state badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
              'text-[10px] font-semibold uppercase tracking-wider',
              saveCls,
            )}
            aria-live="polite"
            aria-label={`Save status: ${saveLabel}`}
          >
            <SaveIcon
              className={cn('h-2.5 w-2.5 shrink-0', isSaving && 'animate-spin')}
              aria-hidden
            />
            {saveLabel}
          </span>
        </div>

        {/* ── Hero heading ── */}
        <h1 className="text-[26px] font-extrabold leading-[1.05] tracking-tighter text-foreground sm:text-[40px]">
          {heading}
        </h1>

        {/* ── Subtitle ── */}
        {subtitle && (
          <p className="mt-2.5 max-w-[52ch] text-[13.5px] leading-relaxed text-muted-foreground/65 sm:mt-3.5 sm:text-[14px] sm:text-muted-foreground/70">
            {subtitle}
          </p>
        )}

        {/* ── KPI chips ── */}
        {(required !== undefined || estTime || completion !== undefined) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">

            {/* Required Fields */}
            {required !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/35 bg-muted/35 px-3 py-1">
                <ListChecks className="h-3 w-3 shrink-0 text-muted-foreground/45" aria-hidden />
                <span className="text-[11px] font-medium text-muted-foreground/55">
                  {required} required
                </span>
              </span>
            )}

            {/* Est. Time */}
            {estTime && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/35 bg-muted/35 px-3 py-1">
                <Clock className="h-3 w-3 shrink-0 text-muted-foreground/45" aria-hidden />
                <span className="text-[11px] font-medium text-muted-foreground/55">
                  ~{estTime}
                </span>
              </span>
            )}

            {/* Completion */}
            {completion !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/35 bg-muted/35 px-3 py-1">
                <TrendingUp className="h-3 w-3 shrink-0 text-muted-foreground/45" aria-hidden />
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground/55">
                  {completion}%
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
