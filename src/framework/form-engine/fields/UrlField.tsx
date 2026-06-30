'use client'

import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, UrlField as Schema } from '../types'

export function UrlField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <Input
            {...field}
            id={getFieldId(schema.key)}
            value={field.value ?? ''}
            type="url"
            placeholder={schema.placeholder ?? 'https://'}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={schema.maxLength}
            inputMode="url"
            aria-invalid={!!fieldState.error}
          />
        </FieldWrapper>
      )}
    />
  )
}
