import type { ComponentType } from 'react'
import type { UseFormReturn } from 'react-hook-form'

/* ─── Grid ──────────────────────────────────────────────────────── */

export type ColSpan = 1|2|3|4|5|6|7|8|9|10|11|12

export interface GridSpan {
  /** Base/default — always applies unless a wider tier below overrides it */
  xs?: ColSpan
  /**
   * These three tiers key off the CONTAINER's rendered width (CSS container
   * queries — see GridEngine.tsx's `@container`), not the viewport. A field
   * inside a full-width card and a field inside a half-width card (e.g. the
   * Identity step's side-by-side Classification/Governance cards) each get
   * columns based on the width they actually have, not the browser window —
   * so a `.half()` field never goes 2-up somewhere too narrow to fit it
   * comfortably just because the *viewport* happened to be wide.
   * Thresholds (see utils.ts's SM/MD/LG maps): sm ≈ 448px container,
   * md ≈ 672px container, lg ≈ 896px container.
   */
  sm?: ColSpan
  md?: ColSpan
  lg?: ColSpan
}

/* ─── Options ───────────────────────────────────────────────────── */

export interface FieldOption {
  value: string | number | boolean
  /**
   * Static display text — the only thing rendered when `labelKey` is
   * absent. For options whose source label isn't locale-neutral (e.g. a
   * PDF/EspoCRM spec written in Greek), also set `labelKey`: this becomes
   * the non-reactive fallback (SSR-safe, no i18n context required) while
   * `labelKey` is what actually resolves per active locale at render time.
   */
  label: string
  /** Semantic i18n key, resolved via t() at render time — see FieldRenderer/SelectField/MultiSelectField's `resolveOptionLabel`. Takes precedence over `label` when present. */
  labelKey?: string
  description?: string
  icon?: ComponentType<{ className?: string }>
  disabled?: boolean
  group?: string
}

export type OptionsLoader = (
  query: string,
  context: Record<string, unknown>,
) => Promise<FieldOption[]>

/* ─── Visibility conditions ─────────────────────────────────────── */

export type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'empty' | 'not_empty'
  | 'in' | 'not_in'

export type ConditionLogic = 'and' | 'or'

export interface FieldCondition {
  field: string
  operator: ConditionOperator
  value?: unknown
}

export interface ConditionGroup {
  logic?: ConditionLogic
  conditions: ConditionNode[]
}

export type ConditionNode = FieldCondition | ConditionGroup

/* ─── Validation ────────────────────────────────────────────────── */

export type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'pattern'; regex: string | RegExp; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'url'; message?: string }
  | { type: 'phone'; message?: string }
  | {
      type: 'custom'
      validate: (
        value: unknown,
        allValues: Record<string, unknown>,
      ) => boolean | string | Promise<boolean | string>
    }
  | {
      type: 'async'
      validate: (value: unknown) => Promise<boolean | string>
      debounce?: number
    }

/* ─── Dependencies ───────────────────────────────────────────────── */

export type DependencyAction = 'clear' | 'reload-options' | 'update-validation' | 'auto-derive'

export interface FieldDependency {
  on: string
  action: DependencyAction
  loadOptions?: OptionsLoader
  /**
   * Used by action: 'auto-derive'. Computes this field's new value from the
   * `on` field's current value (and the full form snapshot, for rules that
   * need more context). Return `undefined` when the rule can't determine a
   * value yet (e.g. controlling field empty) — the engine leaves the field
   * untouched in that case. Synchronous: this is a pure business-rule lookup,
   * not a network fetch (see `loadOptions` for the async case).
   */
  derive?: (parentValue: unknown, allValues: Record<string, unknown>) => unknown
  when?: ConditionNode
}

/* ─── Permissions ────────────────────────────────────────────────── */

export interface FieldPermissions {
  read?: string[]
  write?: string[]
}

/* ─── Field type union ───────────────────────────────────────────── */

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'currency' | 'percentage'
  | 'email' | 'phone' | 'url' | 'password'
  | 'date' | 'datetime' | 'time'
  | 'checkbox' | 'switch' | 'radio'
  | 'select' | 'multi-select' | 'searchable-select'
  | 'async-select' | 'relation'
  | 'tags' | 'rich-text'
  | 'image' | 'multi-image' | 'file'
  | 'coordinates' | 'address' | 'hidden'

/* ─── Base (shared by all concrete types) ────────────────────────── */

interface BaseField {
  /** Unique key — maps to form value path, supports dot notation */
  key: string
  type: FieldType
  /**
   * Semantic i18n key, not literal display text — the schema layer stays
   * framework-agnostic (no React/i18n imports) and the rendering layer
   * (FieldWrapper, field components) resolves these via useTranslation()
   * at render time. This is also what makes live language switching work
   * for free: schemas are plain data built once, so nothing needs to be
   * rebuilt when the active language changes — only the resolved text.
   */
  labelKey: string
  placeholderKey?: string
  descriptionKey?: string
  helperTextKey?: string
  tooltipKey?: string
  /**
   * Presentation-only sub-cluster label — when a run of consecutive fields
   * in a section shares the same `groupLabelKey`, GridEngine renders one
   * caption + divider above that run instead of a single flat grid (see
   * GridEngine.tsx). Purely a rendering grouping; nothing else (RHF, Zod,
   * DependencyEngine, ValidationEngine) reads it, and a field with no
   * `groupLabelKey` renders exactly as it does today.
   */
  groupLabelKey?: string
  required?: boolean
  /** Declarative alternative to a hand-written custom validator: field becomes
   *  required only while this condition evaluates true against the live form values. */
  requiredWhen?: ConditionNode
  disabled?: boolean | ((values: Record<string, unknown>) => boolean)
  /** Declarative disabled condition, OR-combined with `disabled` at render time. */
  disabledWhen?: ConditionNode
  readOnly?: boolean | ((values: Record<string, unknown>) => boolean)
  /** Declarative readOnly condition, OR-combined with `readOnly` at render time. */
  readOnlyWhen?: ConditionNode
  /** When true, the DependencyEngine clears this field's value the moment its
   *  own `visibility` condition flips from visible to hidden. */
  clearWhenHidden?: boolean
  defaultValue?: unknown
  span?: GridSpan
  validation?: ValidationRule[]
  visibility?: ConditionNode
  dependencies?: FieldDependency[]
  permissions?: FieldPermissions
  meta?: Record<string, unknown>
}

/* ─── Concrete field types ───────────────────────────────────────── */

export interface TextField extends BaseField {
  type: 'text'
  maxLength?: number
  characterCounter?: boolean
  prefix?: string
  suffix?: string
  autocomplete?: string
}

export interface TextareaField extends BaseField {
  type: 'textarea'
  rows?: number
  maxLength?: number
  characterCounter?: boolean
}

export interface NumberField extends BaseField {
  type: 'number'
  min?: number
  max?: number
  step?: number
  precision?: number
  prefix?: string
  suffix?: string
}

export interface CurrencyField extends BaseField {
  type: 'currency'
  currencyCode?: string
  /** Name of another field in the form that holds the currency code */
  currencyField?: string
  min?: number
  max?: number
  precision?: number
}

export interface PercentageField extends BaseField {
  type: 'percentage'
  min?: number
  max?: number
  precision?: number
}

export interface EmailField extends BaseField {
  type: 'email'
  maxLength?: number
}

export interface PhoneField extends BaseField {
  type: 'phone'
  defaultCountry?: string
}

export interface UrlField extends BaseField {
  type: 'url'
  maxLength?: number
}

export interface PasswordField extends BaseField {
  type: 'password'
  showStrengthMeter?: boolean
  minLength?: number
}

export interface DateField extends BaseField {
  type: 'date'
  min?: string
  max?: string
}

export interface DateTimeField extends BaseField {
  type: 'datetime'
  min?: string
  max?: string
}

export interface TimeField extends BaseField {
  type: 'time'
  format?: '12h' | '24h'
}

export interface CheckboxField extends BaseField {
  type: 'checkbox'
  checkboxLabelKey?: string
}

export interface SwitchField extends BaseField {
  type: 'switch'
  onLabelKey?: string
  offLabelKey?: string
}

export interface RadioField extends BaseField {
  type: 'radio'
  options: FieldOption[]
  layout?: 'horizontal' | 'vertical' | 'card'
}

export interface SelectField extends BaseField {
  type: 'select'
  options?: FieldOption[]
  loadOptions?: OptionsLoader
  clearable?: boolean
}

export interface MultiSelectField extends BaseField {
  type: 'multi-select'
  options?: FieldOption[]
  loadOptions?: OptionsLoader
  max?: number
  clearable?: boolean
}

export interface SearchableSelectField extends BaseField {
  type: 'searchable-select'
  options?: FieldOption[]
  loadOptions?: OptionsLoader
  clearable?: boolean
  creatable?: boolean
}

export interface AsyncSelectField extends BaseField {
  type: 'async-select'
  loadOptions: OptionsLoader
  defaultOptions?: boolean | FieldOption[]
  cacheOptions?: boolean
  clearable?: boolean
  debounce?: number
}

export interface RelationField extends BaseField {
  type: 'relation'
  entity: string
  displayField?: string
  multiple?: boolean
  searchEndpoint?: string
}

export interface TagsField extends BaseField {
  type: 'tags'
  options?: FieldOption[]
  creatable?: boolean
  max?: number
}

export interface RichTextField extends BaseField {
  type: 'rich-text'
  toolbar?: (
    | 'bold' | 'italic' | 'underline' | 'strikethrough'
    | 'paragraph' | 'heading2' | 'heading3'
    | 'list' | 'orderedList'
    | 'blockquote' | 'link' | 'clearFormatting'
    | '|'
  )[]
  minHeight?: number
  maxLength?: number
}

export interface ImageField extends BaseField {
  type: 'image'
  accept?: string[]
  maxSize?: number
  aspectRatio?: string
  /** Transforms a stored string value (e.g. an attachment id) into a servable
   *  preview URL. Preview-only — the field's submitted value is unaffected.
   *  Optional; omitting it reproduces the previous behavior exactly (the raw
   *  string value is used as-is). */
  resolvePreviewSrc?: (value: string) => string
}

export interface MultiImageField extends BaseField {
  type: 'multi-image'
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  /** Transforms a stored string value (e.g. an attachment id) into a servable
   *  preview URL. Preview-only — the field's submitted value is unaffected.
   *  Optional; omitting it reproduces the previous behavior exactly (the raw
   *  string value is used as-is). */
  resolvePreviewSrc?: (value: string) => string
}

export interface FileField extends BaseField {
  type: 'file'
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
}

export interface CoordinatesField extends BaseField {
  type: 'coordinates'
  defaultCenter?: [number, number]
}

export interface AddressField extends BaseField {
  type: 'address'
  includeCoordinates?: boolean
  fields?: {
    street?: boolean
    city?: boolean
    district?: boolean
    country?: boolean
    postalCode?: boolean
  }
}

export interface HiddenField extends BaseField {
  type: 'hidden'
  value?: unknown
}

/* ─── FieldSchema union ──────────────────────────────────────────── */

export type FieldSchema =
  | TextField | TextareaField | NumberField | CurrencyField | PercentageField
  | EmailField | PhoneField | UrlField | PasswordField
  | DateField | DateTimeField | TimeField
  | CheckboxField | SwitchField | RadioField
  | SelectField | MultiSelectField | SearchableSelectField | AsyncSelectField | RelationField
  | TagsField | RichTextField
  | ImageField | MultiImageField | FileField
  | CoordinatesField | AddressField | HiddenField

/* ─── Section ────────────────────────────────────────────────────── */

export interface SectionSchema {
  id: string
  titleKey?: string
  descriptionKey?: string
  icon?: ComponentType<{ className?: string }>
  fields: FieldSchema[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  background?: 'default' | 'muted' | 'accent' | 'none'
  divider?: boolean
  visibility?: ConditionNode
}

/* ─── Step schema ────────────────────────────────────────────────── */

export interface StepSchema {
  /** If provided, renders with section headers */
  sections?: SectionSchema[]
  /** Shorthand: flat field list in a single implicit section */
  fields?: FieldSchema[]
}

/* ─── Component API ──────────────────────────────────────────────── */

export interface FieldComponentProps<TSchema extends FieldSchema = FieldSchema> {
  schema: TSchema
  form: UseFormReturn<any>
  disabled?: boolean
  readOnly?: boolean
  /** Dynamic options injected by the dependency engine */
  options?: FieldOption[]
  /**
   * True while a `reload-options` dependency's async loader is in flight for
   * this field (see useDynamicForm.ts's useDependencyEngine). The field is
   * already forced `disabled` by GridEngine while this is true — this prop
   * exists so a field component can also swap its placeholder/empty-state
   * copy to something accurate ("Loading…") instead of implying the fetch
   * already finished and returned nothing.
   */
  optionsLoading?: boolean
}

export interface FieldRegistration {
  component: ComponentType<FieldComponentProps<any>>
}

/* ─── Runtime context (DynamicForm internals) ────────────────────── */

export interface DynamicFormContextValue {
  permissions: string[]
  fieldOptions: Record<string, FieldOption[]>
  setFieldOptions: (key: string, options: FieldOption[]) => void
  /** True per field key while its `reload-options` dependency is in flight. */
  fieldOptionsLoading: Record<string, boolean>
  setFieldOptionsLoading: (key: string, loading: boolean) => void
}
