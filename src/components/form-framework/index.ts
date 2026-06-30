/* ─── Core components ──────────────────────────────────────────── */
export { FormFramework, type FormFrameworkProps } from './FormFramework'
export { FormStep } from './FormStep'
export { FormStepCard } from './FormStepCard'
export { FormStepper } from './FormStepper'
export { FormPageHeader } from './FormPageHeader'
export { FormActionBar } from './FormActionBar'
export { FormSkeleton } from './FormSkeleton'
export { SaveStateIndicator } from './SaveStateIndicator'

/* ─── Context & hook ───────────────────────────────────────────── */
export {
  FormFrameworkProvider,
  useFormFramework,
  type FormFrameworkProviderProps,
} from './context'

/* ─── Plugin factories ─────────────────────────────────────────── */
export {
  createKeyboardPlugin,
  createAutosavePlugin,
  createAnalyticsPlugin,
  createPermissionsPlugin,
  createProgressPlugin,
  type KeyboardPluginOptions,
  type AutosavePluginOptions,
  type AnalyticsPluginOptions,
  type PermissionsPluginOptions,
  type ProgressPluginOptions,
} from './plugins'

/* ─── Types ────────────────────────────────────────────────────── */
export type {
  /* Config */
  FormFrameworkConfig,
  StepConfig,
  BreadcrumbItem,
  FormMetadataItem,
  MetadataVariant,
  StepEmptyState,
  FormMode,
  /* Callbacks */
  FormFrameworkCallbacks,
  /* Plugin */
  FormFrameworkPlugin,
  /* Context */
  FormFrameworkContextValue,
  FormStepProps,
  /* State */
  StepStatus,
  NavigationDirection,
  SaveState,
  SaveStatus,
  StepValidationState,
} from './types'
