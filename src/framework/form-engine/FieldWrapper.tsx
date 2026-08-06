'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FormFieldShell } from '@/components/ui/form-field-shell'
import { getFieldId } from './utils'
import type { FieldSchema } from './types'

interface FieldWrapperProps {
  schema: FieldSchema
  error?: string
  disabled?: boolean
  readOnly?: boolean
  /** Current character count — enables character counter display */
  charCount?: number
  children: ReactNode
  className?: string
}

/** Field types that draw their own label next to the control — mirrors
 *  `components/dynamic-form`'s `ownsLabel()`, so switch/checkbox fields look
 *  identical (bordered pill / inline label) regardless of which engine
 *  produced them. The shell's label row is skipped for these. */
function ownsLabel(schema: FieldSchema): boolean {
  return schema.type === 'switch' || schema.type === 'checkbox'
}

/**
 * Wizard-specific adapter over the shared `FormFieldShell`: resolves this
 * engine's i18n keys (labelKey/tooltipKey/descriptionKey/helperTextKey) and
 * the `characterCounter` flag, then hands plain resolved strings to the
 * shell. Every field component renders through this for a11y + visual
 * consistency — and, via the shell, for parity with `components/dynamic-form`.
 *
 * Note: `FormFieldShell` itself sets `aria-describedby`/`aria-invalid` on a
 * wrapper `<div>` around `children`, which screen readers do NOT treat as
 * the description of the native control inside it (that's computed from the
 * focused element's own attributes). Each field component is responsible
 * for also applying `getFieldDescribedBy(schema, error)` (see utils.ts)
 * directly to its own native control — see TextField.tsx etc. for the
 * pattern.
 */
export function FieldWrapper({
  schema,
  error,
  disabled,
  readOnly,
  charCount,
  children,
  className,
}: FieldWrapperProps) {
  const { t } = useTranslation('properties')
  const inputId = getFieldId(schema.key)
  const hasMax = 'maxLength' in schema && typeof schema.maxLength === 'number'
  const showCounter = 'characterCounter' in schema && !!schema.characterCounter && hasMax
  const inlineLabel = ownsLabel(schema)

  const label = !inlineLabel && schema.labelKey ? t(schema.labelKey) : ''
  const tooltip = !inlineLabel && schema.tooltipKey ? t(schema.tooltipKey) : ''
  const description = !inlineLabel && schema.descriptionKey ? t(schema.descriptionKey) : ''
  const helperText = schema.helperTextKey ? t(schema.helperTextKey) : ''

  return (
    <FormFieldShell
      id={inputId}
      label={label}
      required={!inlineLabel ? schema.required : undefined}
      tooltip={tooltip}
      description={description}
      helperText={helperText}
      error={error}
      disabled={disabled}
      readOnly={readOnly}
      // Switch/checkbox fields own their inline label and skip the label
      // row (see `ownsLabel`) — reserve its height anyway so their control
      // aligns with a labeled peer's control when the two share a row.
      reserveLabelSpace={inlineLabel}
      readOnlyLabel={t('wizard.common.readOnly')}
      tooltipAriaLabel={label ? t('wizard.common.moreInfoAbout', { label }) : undefined}
      charCount={showCounter ? charCount : undefined}
      maxLength={showCounter ? (schema as { maxLength: number }).maxLength : undefined}
      className={className}
    >
      {children}
    </FormFieldShell>
  )
}
