'use client'

import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, NumberField as Schema } from '../types'

export function NumberField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="relative">
            {schema.prefix && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
                {schema.prefix}
              </span>
            )}
            <Input
              {...field}
              id={getFieldId(schema.key)}
              value={field.value ?? ''}
              type="number"
              placeholder={schema.placeholder}
              disabled={disabled}
              readOnly={readOnly}
              min={schema.min}
              max={schema.max}
              step={schema.step ?? (schema.precision ? Math.pow(10, -schema.precision) : 1)}
              inputMode="numeric"
              aria-invalid={!!fieldState.error}
              onChange={e => {
                const val = e.target.value
                field.onChange(val === '' ? undefined : Number(val))
              }}
              className={cn(schema.prefix && 'pl-8', schema.suffix && 'pr-8')}
            />
            {schema.suffix && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
                {schema.suffix}
              </span>
            )}
          </div>
        </FieldWrapper>
      )}
    />
  )
}
