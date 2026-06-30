/* ─── Main components ────────────────────────────────────────────── */
export { DynamicForm } from './DynamicForm'
export { DynamicFormStep } from './DynamicFormStep'

/* ─── Rendering internals (exposed for advanced use) ─────────────── */
export { FieldRenderer } from './FieldRenderer'
export { FieldWrapper } from './FieldWrapper'
export { GridEngine } from './GridEngine'
export { SectionRenderer } from './SectionRenderer'

/* ─── Registry ───────────────────────────────────────────────────── */
export { resolveField, registerField } from './FieldRegistry'

/* ─── Engines ────────────────────────────────────────────────────── */
export { buildRules, getValidationHint } from './ValidationEngine'
export { evaluateCondition, isFieldVisible } from './VisibilityEngine'
export { computeDependencyChanges } from './DependencyEngine'

/* ─── Schema builder ─────────────────────────────────────────────── */
export { field, section, step, flatStep } from './SchemaBuilder'

/* ─── Hooks ──────────────────────────────────────────────────────── */
export { useDynamicFormContext } from './useDynamicForm'

/* ─── Utilities ──────────────────────────────────────────────────── */
export { getFieldId, getFieldError, getGridClasses, getAllFields, formatBytes } from './utils'

/* ─── All types ──────────────────────────────────────────────────── */
export type {
  /* Field types */
  FieldType,
  FieldSchema,
  TextField,
  TextareaField,
  NumberField,
  CurrencyField,
  PercentageField,
  EmailField,
  PhoneField,
  UrlField,
  PasswordField,
  DateField,
  DateTimeField,
  TimeField,
  CheckboxField,
  SwitchField,
  RadioField,
  SelectField,
  MultiSelectField,
  SearchableSelectField,
  AsyncSelectField,
  RelationField,
  TagsField,
  RichTextField,
  ImageField,
  MultiImageField,
  FileField,
  CoordinatesField,
  AddressField,
  HiddenField,
  /* Schema */
  StepSchema,
  SectionSchema,
  /* Grid */
  ColSpan,
  GridSpan,
  /* Options */
  FieldOption,
  OptionsLoader,
  /* Conditions */
  ConditionNode,
  ConditionGroup,
  FieldCondition,
  ConditionOperator,
  ConditionLogic,
  /* Validation */
  ValidationRule,
  /* Dependencies */
  FieldDependency,
  DependencyAction,
  /* Permissions */
  FieldPermissions,
  /* Component API */
  FieldComponentProps,
  FieldRegistration,
  /* Context */
  DynamicFormContextValue,
} from './types'
