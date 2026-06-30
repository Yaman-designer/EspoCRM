import type { ComponentType, ReactNode } from 'react'
import type { UseFormReturn, FieldValues } from 'react-hook-form'

/* ─── Step ─────────────────────────────────────────────────────── */

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'error' | 'warning'
export type NavigationDirection = 'forward' | 'backward'
export type FormMode = 'create' | 'edit' | 'view'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface StepEmptyState {
  illustration?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export interface StepConfig {
  id: string
  title: string
  /** Full display title for the step page header (e.g. "Basic Information" vs stepper label "Basic Info") */
  displayTitle?: string
  description?: string
  icon?: ComponentType<{ className?: string }>
  optional?: boolean
  /** Prevents this step from being clicked/jumped to directly from the stepper */
  locked?: boolean
  /** Field names used for selective form.trigger() when autoValidateOnNext is enabled */
  fields?: string[]
  /** Info callout shown inside the card header, below the description */
  helperText?: string
  /** Shows a "Learn more →" link in the helper callout */
  docsUrl?: string
  /** Empty state shown when the step has no content/data yet */
  emptyState?: StepEmptyState
  /** Number of required fields shown in the step header badge */
  requiredCount?: number
  /** Estimated time to complete this step (e.g. "4 min") */
  estTime?: string
  /** Overall form completion percentage after this step (0–100) */
  completion?: number
}

/* ─── Per-step validation state ─────────────────────────────────── */

export interface StepValidationState {
  isDirty: boolean
  isValid: boolean
  hasErrors: boolean
  hasWarnings: boolean
  hasRequiredFields: boolean
  warnings?: string[]
}

/* ─── Save state machine ────────────────────────────────────────── */

export type SaveStatus =
  | 'idle'
  | 'saving'
  | 'saving_draft'
  | 'saved'
  | 'autosaved'
  | 'draft'
  | 'failed'
  | 'unsaved'

export interface SaveState {
  status: SaveStatus
  savedAt?: Date
  error?: string
}

/* ─── Header metadata ───────────────────────────────────────────── */

export type MetadataVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'

export interface FormMetadataItem {
  id: string
  label: string
  value?: string
  /** Chip colour */
  variant?: MetadataVariant
  /** If true the item is shown as a separator dot before it */
  withSeparator?: boolean
}

/* ─── Framework config ──────────────────────────────────────────── */

export interface FormFrameworkConfig {
  title: string
  subtitle?: string
  /** Entity noun used in CTA label — e.g. "Property" → "Create Property" */
  entityLabel?: string
  mode?: FormMode
  steps: StepConfig[]
  breadcrumbs?: BreadcrumbItem[]
  /** Optional metadata chips shown in the page header (draft status, last saved, ID…) */
  metadata?: FormMetadataItem[]
  /**
   * When true, clicking Continue auto-triggers react-hook-form validation
   * for `step.fields` before allowing navigation.
   * Default: false (field components validate themselves inline).
   */
  autoValidateOnNext?: boolean
  /**
   * When true, completed steps cannot be jumped to from the stepper —
   * users must proceed linearly.
   * Default: false
   */
  linearProgress?: boolean
  /** Override the final-step CTA button label */
  submitLabel?: string
  /**
   * When true, clicking Cancel while the form is dirty shows a
   * confirmation dialog. Default: true.
   */
  navigationGuard?: boolean
  /**
   * Overrides the total phases denominator shown in the action bar phase counter.
   * E.g. set to 5 to display "PHASE 01 / 05" even when steps array has 3 entries.
   */
  totalPhasesCount?: number
}

/* ─── Lifecycle callbacks ───────────────────────────────────────── */

export interface FormFrameworkCallbacks<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (data: T) => Promise<void> | void
  onSaveDraft?: (data: T) => Promise<void> | void
  onCancel?: () => void

  /** Fired immediately after the step index changes (after animation starts) */
  onStepChange?: (stepIndex: number, stepId: string) => void
  onAfterNext?: (fromIndex: number, toIndex: number) => void
  onAfterPrevious?: (fromIndex: number, toIndex: number) => void

  /** Return false to block forward navigation */
  onBeforeNext?: (stepIndex: number, form: UseFormReturn<T>) => Promise<boolean> | boolean
  /** Return false to block backward navigation */
  onBeforePrevious?: (stepIndex: number, form: UseFormReturn<T>) => Promise<boolean> | boolean
  /** Return false to block submission */
  onBeforeFinish?: (form: UseFormReturn<T>) => Promise<boolean> | boolean

  onSubmitSuccess?: () => void
  onSubmitError?: (error: unknown) => void
  onDraftSaved?: () => void
  onValidationFailed?: (stepIndex: number, errors: unknown) => void
}

/* ─── Plugin interface ──────────────────────────────────────────── */

export interface FormFrameworkPlugin {
  name: string

  /** Called once on mount. Return cleanup fn. */
  onMount?: (context: FormFrameworkContextValue) => (() => void) | void

  /** Called after every step change (animation start) */
  onStepChange?: (context: FormFrameworkContextValue, prevIndex: number) => void

  /**
   * Called before forward navigation.
   * Return false to block. All plugins must pass.
   */
  onBeforeNext?: (context: FormFrameworkContextValue) => Promise<boolean> | boolean

  /**
   * Called before final submission.
   * Return false to block.
   */
  onBeforeFinish?: (context: FormFrameworkContextValue) => Promise<boolean> | boolean

  /** Renders extra content in the action bar left slot */
  renderActionBarAddon?: (context: FormFrameworkContextValue) => ReactNode

  /** Renders content between the stepper and the step card */
  renderAboveCard?: (context: FormFrameworkContextValue) => ReactNode

  /** Renders overlay content (dialogs, drawers) above everything */
  renderOverlay?: (context: FormFrameworkContextValue) => ReactNode
}

/* ─── Context value ─────────────────────────────────────────────── */

export interface FormFrameworkContextValue {
  config: FormFrameworkConfig
  currentStepIndex: number
  displayedStepIndex: number
  completedSteps: Set<number>
  errorSteps: Set<number>
  warningSteps: Set<number>
  totalSteps: number
  isDirty: boolean

  saveState: SaveState
  setSaveState: (state: SaveState) => void

  stepValidation: Record<string, StepValidationState>
  setStepValidation: (stepId: string, state: Partial<StepValidationState>) => void

  isSubmitting: boolean
  isSavingDraft: boolean
  /** True during animation or async guard checks — disables navigation buttons */
  isAnimating: boolean
  isSubmitSuccess: boolean
  direction: NavigationDirection
  animClass: string

  goToStep: (index: number) => void
  /** Async — runs onBeforeNext guards before navigating */
  goNext: () => Promise<void>
  /** Async — runs onBeforePrevious guards before navigating */
  goPrevious: () => Promise<void>

  getStepStatus: (index: number) => StepStatus
  markStepWarning: (index: number) => void
  clearStepWarning: (index: number) => void
  markStepError: (index: number) => void
  markStepComplete: (index: number) => void

  /** @internal Used by LayoutShell — do not call from outside the framework */
  _setIsSubmitting: (v: boolean) => void
  /** @internal */
  _setIsSavingDraft: (v: boolean) => void
  /** @internal */
  _setIsSubmitSuccess: (v: boolean) => void
}

/* ─── FormStep props ────────────────────────────────────────────── */

export interface FormStepProps {
  /** Must match a StepConfig.id */
  id: string
  children: ReactNode
}
