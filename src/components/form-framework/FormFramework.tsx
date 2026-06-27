'use client'

import {
  Children,
  isValidElement,
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

import { FormFrameworkProvider, useFormFramework } from './context'
import { FormActionBar } from './FormActionBar'
import { FormPageHeader } from './FormPageHeader'
import { FormStep } from './FormStep'
import { FormStepper } from './FormStepper'
import type { FormFrameworkCallbacks, FormFrameworkConfig, FormStepProps } from './types'

/* ─── Inner step card (uses context) ─────────────────────────── */

function StepCard({ stepContent }: { stepContent: ReactNode }) {
  const { config, displayedStepIndex, animClass } = useFormFramework()
  const step = config.steps[displayedStepIndex]
  const StepIcon = step?.icon

  return (
    <div className={cn('will-change-[opacity,transform]', animClass)}>
      <div
        className={cn(
          /* card surface */
          'rounded-[28px] border border-border bg-card shadow-design-md',
          /* overflow hidden keeps rounded corners on inner elements */
          'overflow-hidden',
        )}
        data-slot="form-step-card"
      >
        {/* Card header: step title + description */}
        {step && (
          <div className="border-b border-border px-8 py-6">
            <div className="flex items-start gap-4">
              {StepIcon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10">
                  <StepIcon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
                  {step.title}
                </h2>
                {step.description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Card body: field content */}
        <div className="px-8 py-8">
          {stepContent}
        </div>
      </div>
    </div>
  )
}

/* ─── Inner layout shell (uses context) ──────────────────────── */

interface LayoutShellProps<T extends FieldValues> {
  stepElements: ReactElement<FormStepProps>[]
  callbacks: FormFrameworkCallbacks<T>
}

function LayoutShell<T extends FieldValues>({
  stepElements,
  callbacks,
}: LayoutShellProps<T>) {
  const { config, displayedStepIndex, currentStepIndex, totalSteps } = useFormFramework()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Find the step element matching the currently displayed step id
  const currentStepId = config.steps[displayedStepIndex]?.id
  const currentStepEl = stepElements.find((el) => el.props.id === currentStepId)

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const data = callbacks.form.getValues()
      await callbacks.onSubmit(data as T)
    } finally {
      setIsSubmitting(false)
    }
  }, [callbacks])

  const handleSaveDraft = useCallback(async () => {
    if (!callbacks.onSaveDraft) return
    setIsSavingDraft(true)
    try {
      const data = callbacks.form.getValues()
      await callbacks.onSaveDraft(data as T)
    } finally {
      setIsSavingDraft(false)
    }
  }, [callbacks])

  return (
    /* Page container: flex column, min-h so action bar reaches viewport bottom */
    <div
      className="flex min-h-[calc(100vh-72px)] flex-col"
      data-slot="form-framework"
    >
      {/* ── Page title + breadcrumb ── */}
      <FormPageHeader />

      {/* ── Sticky stepper bar ── */}
      <div className="sticky top-[72px] z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-[720px] px-6 pb-5 pt-4 sm:pb-4">
          <FormStepper />
        </div>
      </div>

      {/* ── Main content area ── */}
      <main className="flex-1 px-6 pb-4 pt-8">
        <div className="mx-auto max-w-[720px]">
          {/* Step progress label */}
          <p className="mb-5 text-xs font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {totalSteps}
            {config.steps[currentStepIndex]?.optional && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Optional
              </span>
            )}
          </p>

          {/* Animated step card */}
          <StepCard stepContent={currentStepEl?.props.children} />
        </div>
      </main>

      {/* ── Sticky bottom action bar ── */}
      <FormActionBar
        onSubmit={handleSubmit}
        onSaveDraft={callbacks.onSaveDraft ? handleSaveDraft : undefined}
        onCancel={callbacks.onCancel}
      />
    </div>
  )
}

/* ─── Public API ──────────────────────────────────────────────── */

export interface FormFrameworkProps<T extends FieldValues = FieldValues>
  extends FormFrameworkCallbacks<T> {
  config: FormFrameworkConfig
  children: ReactNode
  className?: string
}

/**
 * FormFramework — universal multi-step form shell.
 *
 * Usage:
 * ```tsx
 * <FormFramework config={myConfig} form={form} onSubmit={handleSubmit}>
 *   <FormStep id="basics">   <BasicsFields />   </FormStep>
 *   <FormStep id="details">  <DetailsFields />  </FormStep>
 *   <FormStep id="review">   <ReviewPanel />    </FormStep>
 * </FormFramework>
 * ```
 */
export function FormFramework<T extends FieldValues = FieldValues>({
  config,
  children,
  onSubmit,
  onSaveDraft,
  onCancel,
  onStepChange,
  onBeforeNext,
  form,
  className,
}: FormFrameworkProps<T>) {
  // Extract FormStep children; other children are ignored
  const stepElements = Children.toArray(children).filter(
    (child): child is ReactElement<FormStepProps> =>
      isValidElement(child) &&
      (child.type as { displayName?: string }).displayName === 'FormStep',
  )

  const callbacks: FormFrameworkCallbacks<T> = {
    form,
    onSubmit,
    onSaveDraft,
    onCancel,
    onStepChange,
    onBeforeNext,
  }

  return (
    <FormFrameworkProvider
      config={config}
      onStepChange={onStepChange}
    >
      <div className={className}>
        <LayoutShell stepElements={stepElements} callbacks={callbacks} />
      </div>
    </FormFrameworkProvider>
  )
}
