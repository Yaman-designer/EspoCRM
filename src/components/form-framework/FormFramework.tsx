'use client'

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import type { FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { classifyApiError } from '@/lib/errors/classifyApiError'

import { FormFrameworkProvider, useFormFramework } from './context'
import { FormActionBar } from './FormActionBar'
import { FormPageHeader } from './FormPageHeader'
import { FormStep } from './FormStep'
import { FormStepCard } from './FormStepCard'
import { FormStepper } from './FormStepper'
import type {
  FormFrameworkCallbacks,
  FormFrameworkConfig,
  FormFrameworkPlugin,
  FormStepProps,
} from './types'

/* ─── LayoutShell ────────────────────────────────────────────────
   Rendered inside FormFrameworkProvider so it can call useFormFramework().
   Manages: submission flow, navigation guard, focus, beforeunload,
   form-state watching, plugin rendering.
────────────────────────────────────────────────────────────────── */

interface LayoutShellProps<T extends FieldValues> {
  stepElements: ReactElement<FormStepProps>[]
  callbacks: FormFrameworkCallbacks<T>
  plugins: FormFrameworkPlugin[]
  enableNavigationGuard: boolean
}

function LayoutShell<T extends FieldValues>({
  stepElements,
  callbacks,
  plugins,
  enableNavigationGuard,
}: LayoutShellProps<T>) {
  const { t } = useTranslation('common')
  const ctx = useFormFramework()
  const {
    config,
    displayedStepIndex,
    currentStepIndex,
    setSaveState,
    markStepError,
    completedSteps,
    _setIsSubmitting,
    _setIsSavingDraft,
    _setIsSubmitSuccess,
  } = ctx

  const { form } = callbacks

  /* ── Step content resolution ── */
  const currentStepId = config.steps[displayedStepIndex]?.id
  const currentStepEl = stepElements.find(el => el.props.id === currentStepId)

  /* ── Heading ref for focus management ── */
  const headingRef = useRef<HTMLHeadingElement | null>(null)

  /* ── Navigation guard ── */
  const [showGuardDialog, setShowGuardDialog] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const requestNavigation = useCallback(
    (action: () => void) => {
      if (enableNavigationGuard && form.formState.isDirty) {
        pendingActionRef.current = action
        setShowGuardDialog(true)
      } else {
        action()
      }
    },
    [enableNavigationGuard, form.formState.isDirty],
  )

  const confirmLeave = useCallback(() => {
    setShowGuardDialog(false)
    pendingActionRef.current?.()
    pendingActionRef.current = null
  }, [])

  const guardedCancel = useCallback(() => {
    requestNavigation(() => callbacks.onCancel?.())
  }, [requestNavigation, callbacks])

  /* ── Discard Draft dialog ──
     When onDiscardDraft is supplied, the action bar's Discard button always
     asks for confirmation (regardless of dirty state — this is a deliberate
     "wipe my in-progress entry" action, not the generic leave-page guard)
     and resets the wizard's own navigation state after the caller clears its
     draft storage / resets the form. Falls back to guardedCancel when no
     onDiscardDraft is given, so this is a no-op for any other consumer. ── */
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const discardOrCancel = useCallback(() => {
    if (callbacks.onDiscardDraft) {
      setShowDiscardDialog(true)
    } else {
      guardedCancel()
    }
  }, [callbacks, guardedCancel])

  const confirmDiscard = useCallback(async () => {
    setShowDiscardDialog(false)
    await callbacks.onDiscardDraft?.()
    ctx._resetWizardState()
  }, [callbacks, ctx])

  /* ── beforeunload: warn on browser close when dirty ── */
  useEffect(() => {
    if (!enableNavigationGuard) return
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enableNavigationGuard, form.formState.isDirty])

  /* ── Focus management: move to heading after step transition ── */
  useEffect(() => {
    const id = setTimeout(() => {
      headingRef.current?.focus({ preventScroll: true })
    }, 200)
    return () => clearTimeout(id)
  }, [currentStepIndex])

  /* ── Live field validation watching (when step.fields defined) ──
     Marks completed steps as error if their fields become invalid  */
  useEffect(() => {
    const errors = form.formState.errors
    config.steps.forEach((step, idx) => {
      if (!step.fields?.length || !completedSteps.has(idx)) return
      const hasError = step.fields.some(fieldPath => {
        const keys = fieldPath.split('.')
        let cursor: Record<string, unknown> = errors as Record<string, unknown>
        for (const key of keys) {
          if (cursor == null) return false
          cursor = cursor[key] as Record<string, unknown>
        }
        return Boolean(cursor)
      })
      if (hasError) markStepError(idx)
    })
  }, [form.formState.errors, config.steps, completedSteps, markStepError])

  /* ── Update save state to 'unsaved' when form becomes dirty ── */
  const { saveState } = ctx
  useEffect(() => {
    if (
      form.formState.isDirty &&
      (saveState.status === 'idle' ||
        saveState.status === 'saved' ||
        saveState.status === 'autosaved')
    ) {
      setSaveState({ status: 'unsaved' })
    }
  }, [form.formState.isDirty, saveState.status, setSaveState])

  /* ── Submission handler ── */
  const handleSubmit = useCallback(async () => {
    if (callbacks.onBeforeFinish) {
      const ok = await callbacks.onBeforeFinish(form)
      if (!ok) return
    }
    for (const plugin of plugins) {
      if (plugin.onBeforeFinish) {
        const ok = await plugin.onBeforeFinish(ctx)
        if (!ok) return
      }
    }

    _setIsSubmitting(true)
    setSaveState({ status: 'saving' })

    try {
      const data = form.getValues() as T
      await callbacks.onSubmit(data)
      _setIsSubmitSuccess(true)
      setSaveState({ status: 'saved', savedAt: new Date() })
      callbacks.onSubmitSuccess?.()
      // Return to idle after success animation
      setTimeout(() => _setIsSubmitSuccess(false), 1200)
    } catch (err) {
      // Generic, entity-agnostic message for the inline stepper indicator —
      // callers get the entity-aware, actionable version via onSubmitError
      // (see lib/errors/presentApiError), which also drives the toast.
      setSaveState({ status: 'failed', error: classifyApiError(err).message })
      callbacks.onSubmitError?.(err)
    } finally {
      _setIsSubmitting(false)
    }
  }, [callbacks, form, plugins, ctx, setSaveState, _setIsSubmitting, _setIsSubmitSuccess])

  /* ── Draft save handler ── */
  const handleSaveDraft = useCallback(async () => {
    if (!callbacks.onSaveDraft) return
    _setIsSavingDraft(true)
    setSaveState({ status: 'saving_draft' })
    try {
      await callbacks.onSaveDraft(form.getValues() as T)
      setSaveState({ status: 'autosaved', savedAt: new Date() })
      callbacks.onDraftSaved?.()
    } catch (err) {
      setSaveState({ status: 'failed', error: classifyApiError(err).message })
    } finally {
      _setIsSavingDraft(false)
    }
  }, [callbacks, form, setSaveState, _setIsSavingDraft])

  /* ── Plugin above-card slots ── */
  const aboveCardSlots = plugins
    .map(p => p.renderAboveCard?.(ctx))
    .filter(Boolean)

  /* ── Plugin overlay slots (dialogs, drawers) ── */
  const overlaySlots = plugins
    .map(p => p.renderOverlay?.(ctx))
    .filter(Boolean)

  return (
    <div
      className="flex min-h-[calc(100vh-72px)] flex-col ff-form-mount"
      data-slot="form-framework"
    >
      {/* ── Top stepper section ── */}
      <div className="border-b border-border/25">
        <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6 sm:pt-5 sm:pb-4 lg:max-w-7xl">
          <FormStepper />
        </div>
      </div>

      {/* ── Step page header — display title, description, metadata badges ── */}
      <FormPageHeader />

      {/* ── Main workspace ──
          Bottom padding is driven by --ff-action-bar-h, a CSS var the sticky
          FormActionBar publishes from its own measured (ResizeObserver)
          height — see usePublishBarHeight in FormActionBar.tsx. The bar's
          height genuinely differs by breakpoint (2-row mobile stack vs. a
          single desktop row) and by content (safe-area inset, autosave
          label appearing/disappearing), so a hardcoded padding constant
          per breakpoint drifts out of sync with the bar it's meant to
          clear — that mismatch is exactly what let fields hide behind the
          bar. Deriving it from the bar's real size fixes that structurally
          instead of re-guessing better constants. The 11rem fallback only
          matters for the first paint before the observer runs. */}
      <main
        // pt-4 (down from pt-5): FormPageHeader already contributes its own
        // pb-3.5/sm:pb-4 below the heading, so this is the SECOND padding
        // stacking on top of that gap before the first card — full
        // header-to-card gap is now ~30px mobile / ~32px desktop (was
        // ~34px/40px). Still a deliberate gap, not zero — polish pass, not
        // the structural fix that landed the first tightening.
        className="flex-1 px-5 pt-4 sm:px-6"
        style={{ paddingBottom: 'calc(var(--ff-action-bar-h, 11rem) + 1.5rem)' }}
      >
        <div className="mx-auto max-w-6xl lg:max-w-7xl">

          {/* Plugin above-card content */}
          {aboveCardSlots.map((slot, i) => (
            <div key={i} className="mb-4">{slot}</div>
          ))}

          {/* Step workspace */}
          <FormStepCard headingRef={headingRef}>
            {currentStepEl?.props.children}
          </FormStepCard>
        </div>
      </main>

      {/* ── Sticky bottom action bar ── */}
      <FormActionBar
        onSubmit={handleSubmit}
        onCancel={discardOrCancel}
        isDiscardAction={!!callbacks.onDiscardDraft}
        plugins={plugins}
      />

      {/* ── Navigation guard dialog ── */}
      <AlertDialog open={showGuardDialog} onOpenChange={setShowGuardDialog}>
        <AlertDialogContent
          className={cn(
            'w-[calc(100%-2rem)] max-w-sm gap-0 overflow-hidden rounded-2xl p-0',
            'shadow-[0_12px_48px_rgba(16,24,40,0.14),0_3px_12px_rgba(16,24,40,0.08)]',
          )}
        >
          {/* Content zone — generous vertical breathing room */}
          <AlertDialogHeader className="px-7 pb-7 pt-8">
            <AlertDialogTitle className="text-[19px] font-semibold tracking-tight text-foreground">
              {t('formFramework.leaveGuard.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground/70">
              {t('formFramework.leaveGuard.description1')}
              <br />
              {t('formFramework.leaveGuard.description2')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Separator — fine rule between content and action zone */}
          <div className="border-t border-border/20" />

          {/*
            DOM order: Leave Page first (left on desktop / bottom on mobile),
            Continue Editing last (right on desktop / top on mobile via flex-col-reverse).
            autoFocus on Continue Editing so it receives focus on open.
          */}
          <AlertDialogFooter className="mx-0 mb-0 border-t-0 gap-3 bg-muted/40 px-6 pb-6 pt-5 sm:items-center">

            {/* Leave Page — premium ghost, clearly subordinate */}
            <AlertDialogAction
              onClick={confirmLeave}
              variant="ghost"
              className={cn(
                'h-12 w-full rounded-xl px-5 text-[13px] font-medium',
                'border border-border/50 bg-background text-foreground/65',
                'hover:border-border/70 hover:bg-muted/60 hover:text-foreground/90',
                'active:bg-muted/80',
                'focus-visible:ring-2 focus-visible:ring-ring/25',
                'shadow-none transition-all duration-200',
                'sm:h-11 sm:w-auto sm:min-w-32',
              )}
            >
              {t('formFramework.leaveGuard.leavePage')}
            </AlertDialogAction>

            {/* Continue Editing — hero primary action */}
            <AlertDialogCancel
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              variant="default"
              className={cn(
                'h-12 w-full rounded-xl px-6 text-[13.5px] font-semibold',
                'shadow-[0_1px_3px_rgba(0,0,0,0.10),0_3px_10px_rgba(0,97,188,0.18)]',
                'hover:shadow-[0_2px_8px_rgba(0,0,0,0.12),0_6px_18px_rgba(0,97,188,0.22)] hover:-translate-y-px',
                'active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
                'transition-all duration-200',
                'sm:h-11 sm:w-auto sm:min-w-40',
              )}
            >
              {t('formFramework.leaveGuard.continueEditing')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Discard draft dialog ── */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent
          className={cn(
            'w-[calc(100%-2rem)] max-w-sm gap-0 overflow-hidden rounded-2xl p-0',
            'shadow-[0_12px_48px_rgba(16,24,40,0.14),0_3px_12px_rgba(16,24,40,0.08)]',
          )}
        >
          <AlertDialogHeader className="px-7 pb-7 pt-8">
            <AlertDialogTitle className="text-[19px] font-semibold tracking-tight text-foreground">
              {t('formFramework.discardDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground/70">
              {t('formFramework.discardDialog.description1')}
              <br />
              {t('formFramework.discardDialog.description2')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="border-t border-border/20" />

          <AlertDialogFooter className="mx-0 mb-0 border-t-0 gap-3 bg-muted/40 px-6 pb-6 pt-5 sm:items-center">
            <AlertDialogCancel
              variant="ghost"
              className={cn(
                'h-12 w-full rounded-xl px-5 text-[13px] font-medium',
                'border border-border/50 bg-background text-foreground/65',
                'hover:border-border/70 hover:bg-muted/60 hover:text-foreground/90',
                'active:bg-muted/80',
                'focus-visible:ring-2 focus-visible:ring-ring/25',
                'shadow-none transition-all duration-200',
                'sm:h-11 sm:w-auto sm:min-w-32',
              )}
            >
              {t('formFramework.discardDialog.keepEditing')}
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDiscard}
              variant="destructive"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className={cn(
                'h-12 w-full rounded-xl px-6 text-[13.5px] font-semibold',
                'shadow-[0_1px_3px_rgba(0,0,0,0.10)]',
                'transition-all duration-200',
                'sm:h-11 sm:w-auto sm:min-w-40',
              )}
            >
              {t('formFramework.discardDialog.discardDraft')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Plugin overlay slots ── */}
      {overlaySlots.map((slot, i) => (
        <span key={i}>{slot}</span>
      ))}
    </div>
  )
}

/* ─── Public API ─────────────────────────────────────────────────── */

export interface FormFrameworkProps<T extends FieldValues = FieldValues>
  extends FormFrameworkCallbacks<T> {
  config: FormFrameworkConfig
  plugins?: FormFrameworkPlugin[]
  children: ReactNode
  className?: string
}

/**
 * FormFramework — universal multi-step form shell.
 *
 * ```tsx
 * <FormFramework config={config} form={form} onSubmit={handleSubmit}>
 *   <FormStep id="basics">  <BasicFields />  </FormStep>
 *   <FormStep id="details"> <DetailFields /> </FormStep>
 *   <FormStep id="review">  <ReviewPanel />  </FormStep>
 * </FormFramework>
 * ```
 */
export function FormFramework<T extends FieldValues = FieldValues>({
  config,
  children,
  plugins = [],
  form,
  onSubmit,
  onSaveDraft,
  onCancel,
  onStepChange,
  onAfterNext,
  onAfterPrevious,
  onBeforeNext,
  onBeforePrevious,
  onBeforeFinish,
  onSubmitSuccess,
  onSubmitError,
  onDraftSaved,
  onValidationFailed,
  onDiscardDraft,
  className,
}: FormFrameworkProps<T>) {
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
    onAfterNext,
    onAfterPrevious,
    onBeforeNext,
    onBeforePrevious,
    onBeforeFinish,
    onSubmitSuccess,
    onSubmitError,
    onDraftSaved,
    onValidationFailed,
    onDiscardDraft,
  }

  const enableNavigationGuard = config.navigationGuard !== false

  /* isDirty subscription — keep provider reactive to form state */
  const { isDirty } = form.formState

  return (
    <FormFrameworkProvider
      config={config}
      callbacks={callbacks}
      plugins={plugins}
      isDirty={isDirty}
    >
      <div className={cn(className)}>
        <LayoutShell
          stepElements={stepElements}
          callbacks={callbacks}
          plugins={plugins}
          enableNavigationGuard={enableNavigationGuard}
        />
      </div>
    </FormFrameworkProvider>
  )
}
