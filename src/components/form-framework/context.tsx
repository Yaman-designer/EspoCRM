'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { FieldValues } from 'react-hook-form'
import type {
  FormFrameworkCallbacks,
  FormFrameworkConfig,
  FormFrameworkContextValue,
  FormFrameworkPlugin,
  NavigationDirection,
  SaveState,
  StepStatus,
  StepValidationState,
} from './types'

/* ─── Context ───────────────────────────────────────────────────── */

const FormFrameworkContext = createContext<FormFrameworkContextValue | null>(null)

export function useFormFramework(): FormFrameworkContextValue {
  const ctx = useContext(FormFrameworkContext)
  if (!ctx) throw new Error('useFormFramework must be used inside <FormFramework>')
  return ctx
}

/* ─── Provider ──────────────────────────────────────────────────── */

export interface FormFrameworkProviderProps<T extends FieldValues = FieldValues> {
  config: FormFrameworkConfig
  callbacks: FormFrameworkCallbacks<T>
  plugins?: FormFrameworkPlugin[]
  isDirty?: boolean
  children: ReactNode
}

export function FormFrameworkProvider<T extends FieldValues>({
  config,
  callbacks,
  plugins = [],
  isDirty = false,
  children,
}: FormFrameworkProviderProps<T>) {
  const totalSteps = config.steps.length

  /* ── Navigation state ── */
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set<number>())
  const [errorSteps, setErrorSteps] = useState(new Set<number>())
  const [warningSteps, setWarningSteps] = useState(new Set<number>())
  const [direction, setDirection] = useState<NavigationDirection>('forward')
  const [animClass, setAnimClass] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  /* ── Submission/save state ── */
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })

  /* ── Per-step validation ── */
  const [stepValidation, setStepValidationMap] = useState<Record<string, StepValidationState>>({})

  /* ── Mutable refs (break stale closures) ── */
  const isNavigatingRef = useRef(false)
  const isProcessingRef = useRef(false)
  const callbacksRef = useRef(callbacks)
  const pluginsRef = useRef(plugins)
  const valueRef = useRef<FormFrameworkContextValue>(null!)
  const currentIdxRef = useRef(currentStepIndex)

  useLayoutEffect(() => { callbacksRef.current = callbacks }, [callbacks])
  useLayoutEffect(() => { pluginsRef.current = plugins }, [plugins])
  useLayoutEffect(() => { currentIdxRef.current = currentStepIndex }, [currentStepIndex])

  /* ─── Step helpers ──────────────────────────────────────────── */

  const markStepComplete = useCallback((i: number) => {
    setCompletedSteps(p => new Set(p).add(i))
    setErrorSteps(p => { const s = new Set(p); s.delete(i); return s })
  }, [])

  const markStepError = useCallback((i: number) => {
    setErrorSteps(p => new Set(p).add(i))
    setCompletedSteps(p => { const s = new Set(p); s.delete(i); return s })
  }, [])

  const markStepWarning = useCallback((i: number) => {
    setWarningSteps(p => new Set(p).add(i))
  }, [])

  const clearStepWarning = useCallback((i: number) => {
    setWarningSteps(p => { const s = new Set(p); s.delete(i); return s })
  }, [])

  const setStepValidation = useCallback(
    (stepId: string, state: Partial<StepValidationState>) => {
      setStepValidationMap(p => ({
        ...p,
        [stepId]: { ...(p[stepId] ?? {}), ...state } as StepValidationState,
      }))
    },
    [],
  )

  const getStepStatus = useCallback(
    (i: number): StepStatus => {
      if (errorSteps.has(i)) return 'error'
      if (warningSteps.has(i)) return 'warning'
      if (completedSteps.has(i)) return 'completed'
      if (i === currentStepIndex) return 'current'
      return 'upcoming'
    },
    [currentStepIndex, completedSteps, errorSteps, warningSteps],
  )

  /* ─── Raw animation-only navigate ──────────────────────────── */

  const doNavigate = useCallback(
    (newIndex: number, dir: NavigationDirection, afterSwap?: () => void) => {
      if (isNavigatingRef.current) return
      if (newIndex < 0 || newIndex >= totalSteps) return

      isNavigatingRef.current = true
      setIsNavigating(true)
      setDirection(dir)
      setAnimClass(dir === 'forward' ? 'ff-exit-forward' : 'ff-exit-backward')

      setTimeout(() => {
        setDisplayedStepIndex(newIndex)
        setCurrentStepIndex(newIndex)
        setAnimClass(dir === 'forward' ? 'ff-enter-forward' : 'ff-enter-backward')
        afterSwap?.()

        setTimeout(() => {
          setAnimClass('')
          isNavigatingRef.current = false
          setIsNavigating(false)
        }, 280)
      }, 170)
    },
    [totalSteps],
  )

  /* ─── Guarded goNext ────────────────────────────────────────── */

  const goNext = useCallback(async () => {
    if (isNavigatingRef.current || isProcessingRef.current) return

    const idx = currentIdxRef.current
    const cb = callbacksRef.current
    const step = config.steps[idx]

    isProcessingRef.current = true
    setIsProcessing(true)

    try {
      /* 1 — Auto-validate step fields if enabled */
      if (config.autoValidateOnNext && step?.fields?.length) {
        const valid = await cb.form.trigger(step.fields as any[])
        if (!valid) {
          markStepError(idx)
          cb.onValidationFailed?.(idx, cb.form.formState.errors)
          return
        }
      }

      /* 2 — User's onBeforeNext */
      if (cb.onBeforeNext) {
        const ok = await cb.onBeforeNext(idx, cb.form)
        if (!ok) { markStepError(idx); return }
      }

      /* 3 — Plugin onBeforeNext hooks (all must pass) */
      for (const plugin of pluginsRef.current) {
        if (plugin.onBeforeNext) {
          const ok = await plugin.onBeforeNext(valueRef.current)
          if (!ok) return
        }
      }

      /* All guards passed — navigate */
      markStepComplete(idx)
      doNavigate(idx + 1, 'forward', () => {
        cb.onStepChange?.(idx + 1, config.steps[idx + 1]?.id ?? '')
        cb.onAfterNext?.(idx, idx + 1)
        pluginsRef.current.forEach(p => p.onStepChange?.(valueRef.current, idx))
      })
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  }, [config, doNavigate, markStepComplete, markStepError])

  /* ─── Guarded goPrevious ────────────────────────────────────── */

  const goPrevious = useCallback(async () => {
    if (isNavigatingRef.current || isProcessingRef.current) return

    const idx = currentIdxRef.current
    const cb = callbacksRef.current

    isProcessingRef.current = true
    setIsProcessing(true)

    try {
      if (cb.onBeforePrevious) {
        const ok = await cb.onBeforePrevious(idx, cb.form)
        if (!ok) return
      }

      doNavigate(idx - 1, 'backward', () => {
        cb.onStepChange?.(idx - 1, config.steps[idx - 1]?.id ?? '')
        cb.onAfterPrevious?.(idx, idx - 1)
        pluginsRef.current.forEach(p => p.onStepChange?.(valueRef.current, idx))
      })
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  }, [config, doNavigate])

  /* ─── goToStep (direct jump, respects locking) ──────────────── */

  const goToStep = useCallback(
    (index: number) => {
      const idx = currentIdxRef.current
      if (index === idx) return
      const step = config.steps[index]
      if (step?.locked) return
      if (config.linearProgress && index > idx && !completedSteps.has(index - 1)) return
      doNavigate(index, index > idx ? 'forward' : 'backward')
    },
    [config, completedSteps, doNavigate],
  )

  /* ─── Context value ─────────────────────────────────────────── */

  const value = useMemo<FormFrameworkContextValue>(
    () => ({
      config,
      currentStepIndex,
      displayedStepIndex,
      completedSteps,
      errorSteps,
      warningSteps,
      totalSteps,
      isDirty,
      saveState,
      setSaveState,
      stepValidation,
      setStepValidation,
      isSubmitting,
      isSavingDraft,
      isSubmitSuccess,
      isAnimating: isNavigating || isProcessing,
      direction,
      animClass,
      goToStep,
      goNext,
      goPrevious,
      getStepStatus,
      markStepWarning,
      clearStepWarning,
      markStepError,
      markStepComplete,
      /* internal setters — used by LayoutShell only */
      _setIsSubmitting: setIsSubmitting,
      _setIsSavingDraft: setIsSavingDraft,
      _setIsSubmitSuccess: setIsSubmitSuccess,
    }),
    [
      config, currentStepIndex, displayedStepIndex, completedSteps, errorSteps,
      warningSteps, totalSteps, isDirty, saveState, stepValidation, setStepValidation,
      isSubmitting, isSavingDraft, isSubmitSuccess, isNavigating, isProcessing,
      direction, animClass,
      goToStep, goNext, goPrevious, getStepStatus,
      markStepWarning, clearStepWarning, markStepError, markStepComplete,
    ],
  )

  useLayoutEffect(() => { valueRef.current = value }, [value])

  /* ─── Plugin mount lifecycle ────────────────────────────────── */

  // intentionally run only once on mount; plugins update via pluginsRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const cleanups = pluginsRef.current
      .filter(p => p.onMount)
      .map(p => p.onMount!(valueRef.current))
      .filter((c): c is () => void => typeof c === 'function')

    return () => cleanups.forEach(c => c())
  }, [])

  return (
    <FormFrameworkContext.Provider value={value}>
      {children}
    </FormFrameworkContext.Provider>
  )
}
