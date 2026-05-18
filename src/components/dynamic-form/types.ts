import type { ComponentType, ElementType } from 'react'
import type { z } from 'zod'
import type { ResourceKey } from '@/shared/registry'

// ── Field Types ────────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'phone'
  | 'textarea'
  | 'currency'
  | 'select'
  | 'async-select'
  | 'multi-select'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'time'
  | 'file'
  | 'image'
  | 'rich-text'
  | 'tags'
  | 'status'

// ── Select Option ──────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

// ── Field Configuration ────────────────────────────────────────────────────────

export interface FieldConfig {
  name: string
  label: string
  type: FieldType

  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean

  // Layout: 1 = half width, 2 = full width (in 2-col grid)
  colSpan?: 1 | 2 | 3

  // Conditional: hide field when predicate returns false
  showWhen?: (values: Record<string, unknown>) => boolean

  // Static options for select / radio / multi-select
  options?: SelectOption[]

  // Shared resource — registry handles all mapping, returns {label, value}[] automatically.
  // DO NOT add labelKey/valueKey when using resource — they are ignored.
  resource?: ResourceKey

  // Custom endpoint — use when resource does not exist in registry.
  // Requires labelKey + valueKey to map raw API rows to {label, value}.
  api?: string
  labelKey?: string   // field name to use as label  (default: 'label')
  valueKey?: string   // field name to use as value  (default: 'value')
  /** @deprecated use labelKey */
  optionLabel?: string
  /** @deprecated use valueKey */
  optionValue?: string

  // Quick-pick chips for number inputs (e.g. probability: [10, 25, 50, 75, 90, 100])
  presets?: number[]
  // Suffix label rendered inside the number input (e.g. '%')
  suffix?: string

  // Text
  maxLength?: number
  minLength?: number

  // Number / currency
  min?: number
  max?: number
  step?: number
  currency?: string  // e.g. 'USD', 'SAR', '$', '﷼'

  // Textarea
  rows?: number

  // File / image upload (react-dropzone)
  // accept: MIME type string e.g. 'image/*', 'application/pdf'
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
}

// ── Form Section ───────────────────────────────────────────────────────────────

export interface FormSectionConfig {
  key: string
  title?: string
  description?: string
  icon?: ElementType
  fields: FieldConfig[]
  columns?: 1 | 2 | 3
}

// ── Form Mode ──────────────────────────────────────────────────────────────────

export type FormMode = 'create' | 'edit' | 'view'

// ── DynamicForm Props ──────────────────────────────────────────────────────────

export interface DynamicFormProps<T = Record<string, unknown>> {
  // Dialog state
  open: boolean
  onClose: () => void
  onSuccess?: (data?: T) => void

  // Header
  title: string
  description?: string
  icon?: ComponentType<{ className?: string }>

  // Form configuration
  sections: FormSectionConfig[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any>

  // API
  endpoint: string

  // Data
  initialData?: Partial<T>
  defaultValues?: Record<string, unknown>
  mode?: FormMode

  // Dialog sizing
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  // Submit button label override
  submitLabel?: string

  // Transform payload before sending to API
  transformSubmit?: (data: Record<string, unknown>) => Record<string, unknown>
}
