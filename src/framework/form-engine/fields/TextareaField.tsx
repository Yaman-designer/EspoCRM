'use client'

import { Controller, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, getFieldDescribedBy } from '../utils'
import type { FieldComponentProps, TextareaField as Schema } from '../types'

export function TextareaField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const value = useWatch({ control: form.control, name: schema.key }) ?? ''
  const charCount = typeof value === 'string' ? value.length : 0

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper
          schema={schema}
          error={fieldState.error?.message}
          disabled={disabled}
          readOnly={readOnly}
          charCount={schema.characterCounter && schema.maxLength ? charCount : undefined}
        >
          <Textarea
            {...field}
            id={getFieldId(schema.key)}
            value={field.value ?? ''}
            placeholder={schema.placeholderKey ? t(schema.placeholderKey) : undefined}
            disabled={disabled}
            readOnly={readOnly}
            rows={schema.rows ?? 4}
            maxLength={schema.maxLength}
            aria-invalid={!!fieldState.error}
            aria-describedby={getFieldDescribedBy(schema, fieldState.error?.message)}
            className="resize-none"
          />
        </FieldWrapper>
      )}
    />
  )
}
