'use client'

import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, DateTimeField as Schema } from '../types'

export function DateTimeField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
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
            type="datetime-local"
            placeholder={schema.placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={schema.min}
            max={schema.max}
            aria-invalid={!!fieldState.error}
          />
        </FieldWrapper>
      )}
    />
  )
}
