'use client'

import { ArrowLeft, ArrowRight, Check, Loader2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFormFramework } from './context'

interface FormActionBarProps {
  /** Override the final-step CTA label. Defaults to "Create {entityLabel}" or "Save Changes" */
  submitLabel?: string
  onSubmit?: () => void
  onSaveDraft?: () => void
  onCancel?: () => void
  className?: string
}

export function FormActionBar({
  submitLabel,
  onSubmit,
  onSaveDraft,
  onCancel,
  className,
}: FormActionBarProps) {
  const {
    config,
    currentStepIndex,
    totalSteps,
    isSubmitting,
    isSavingDraft,
    isAnimating,
    goNext,
    goPrevious,
  } = useFormFramework()

  const isFirstStep = currentStepIndex === 0
  const isLastStep  = currentStepIndex === totalSteps - 1

  const defaultSubmitLabel = config.mode === 'edit'
    ? 'Save Changes'
    : `Create ${config.entityLabel ?? 'Record'}`

  const ctaLabel = submitLabel ?? defaultSubmitLabel

  const disabled = isAnimating || isSubmitting || isSavingDraft

  return (
    <div
      className={cn(
        /* sticky to bottom of the flex-column page wrapper */
        'sticky bottom-0 z-30',
        /* glass surface */
        'border-t border-border bg-card/95 backdrop-blur-md',
        /* upward shadow */
        'shadow-[0_-4px_20px_rgba(16,24,40,0.05)]',
        className,
      )}
      data-slot="form-action-bar"
    >
      <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 px-6 py-4">

        {/* ── Left group: Cancel ── */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>

          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={disabled}
            >
              {isSavingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSavingDraft ? 'Saving…' : 'Save Draft'}
              </span>
            </Button>
          )}
        </div>

        {/* ── Step counter (centre) ── */}
        <span
          className="hidden text-xs font-medium text-muted-foreground sm:block"
          aria-live="polite"
          aria-atomic="true"
        >
          {currentStepIndex + 1} / {totalSteps}
        </span>

        {/* ── Right group: Previous + Next/Submit ── */}
        <div className="flex items-center gap-2.5">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goPrevious}
              disabled={disabled}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          )}

          {isLastStep ? (
            /* Final step — primary submit */
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={onSubmit}
              disabled={disabled}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  {ctaLabel}
                </>
              )}
            </Button>
          ) : (
            /* Intermediate steps — Continue */
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={goNext}
              disabled={disabled}
              className="min-w-[120px]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
