import type { ComponentType } from 'react'
import type { UseFormReturn } from 'react-hook-form'

/* ─── Grid ──────────────────────────────────────────────────────── */

export type ColSpan = 1|2|3|4|5|6|7|8|9|10|11|12

export interface GridSpan {
  /** Mobile < 640px (base/default) */
  xs?: ColSpan
  /** ≥ 640px */
  sm?: ColSpan
  /** ≥ 768px */
  md?: ColSpan
  /** ≥ 1024px */
  lg?: ColSpan
}

/* ─── Options ───────────────────────────────────────────────────── */

export interface FieldOption {
  value: string | number | boolean
  label: string
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

export type DependencyAction = 'clear' | 'reload-options' | 'update-validation'

export interface FieldDependency {
  on: string
  action: DependencyAction
  loadOptions?: OptionsLoader
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
  label: string
  placeholder?: string
  description?: string
  helperText?: string
  tooltip?: string
  required?: boolean
  disabled?: boolean | ((values: Record<string, unknown>) => boolean)
  readOnly?: boolean | ((values: Record<string, unknown>) => boolean)
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
  checkboxLabel?: string
}

export interface SwitchField extends BaseField {
  type: 'switch'
  onLabel?: string
  offLabel?: string
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
}

export interface MultiImageField extends BaseField {
  type: 'multi-image'
  accept?: string[]
  maxSize?: number
  maxFiles?: number
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
  title?: string
  description?: string
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
}

export interface FieldRegistration {
  component: ComponentType<FieldComponentProps<any>>
}

/* ─── Runtime context (DynamicForm internals) ────────────────────── */

export interface DynamicFormContextValue {
  permissions: string[]
  fieldOptions: Record<string, FieldOption[]>
  setFieldOptions: (key: string, options: FieldOption[]) => void
}
