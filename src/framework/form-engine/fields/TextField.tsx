'use client'

import { Controller, useWatch } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, TextField as Schema } from '../types'

export function TextField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
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
              type="text"
              placeholder={schema.placeholder}
              disabled={disabled}
              readOnly={readOnly}
              maxLength={schema.maxLength}
              autoComplete={schema.autocomplete}
              aria-invalid={!!fieldState.error}
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
