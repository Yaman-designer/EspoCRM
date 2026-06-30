'use client'

import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, PercentageField as Schema } from '../types'

export function PercentageField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="relative">
            <Input
              {...field}
              id={getFieldId(schema.key)}
              value={field.value ?? ''}
              type="number"
              placeholder={schema.placeholder ?? '0'}
              disabled={disabled}
              readOnly={readOnly}
              min={schema.min ?? 0}
              max={schema.max ?? 100}
              step={schema.precision != null ? Math.pow(10, -schema.precision) : 1}
              inputMode="decimal"
              aria-invalid={!!fieldState.error}
              onChange={e => {
                const val = e.target.value
                field.onChange(val === '' ? undefined : Number(val))
              }}
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
              %
            </span>
          </div>
        </FieldWrapper>
      )}
    />
  )
}
