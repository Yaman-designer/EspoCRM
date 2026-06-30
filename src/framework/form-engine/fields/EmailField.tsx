'use client'

import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, EmailField as Schema } from '../types'

export function EmailField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
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
            type="email"
            placeholder={schema.placeholder ?? 'name@example.com'}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={schema.maxLength}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!fieldState.error}
          />
        </FieldWrapper>
      )}
    />
  )
}
