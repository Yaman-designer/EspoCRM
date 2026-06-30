'use client'

import { Controller } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, SelectField as Schema } from '../types'

export function SelectField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const opts = options ?? schema.options ?? []

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <Select
            value={field.value != null ? String(field.value) : ''}
            onValueChange={val => {
              if (readOnly) return
              // Find original option to preserve value type
              const opt = opts.find(o => String(o.value) === val)
              field.onChange(opt?.value ?? val)
            }}
            disabled={disabled || readOnly}
          >
            <SelectTrigger
              id={getFieldId(schema.key)}
              aria-invalid={!!fieldState.error}
              className="data-[size=default]:h-12 w-full rounded-xl border-border/70 pl-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:border-border/90 hover:shadow-[0_1px_4px_rgba(16,24,40,0.07)] focus-visible:ring-ring/15 data-placeholder:text-muted-foreground/50"
            >
              <SelectValue
                placeholder={schema.placeholder ?? `Select ${schema.label.toLowerCase()}…`}
              />
            </SelectTrigger>
            <SelectContent className="p-1">
              {schema.clearable && (
                <SelectItem value="__clear__">
                  <span className="text-muted-foreground">— Clear —</span>
                </SelectItem>
              )}
              {opts.map(opt => (
                <SelectItem
                  key={String(opt.value)}
                  value={String(opt.value)}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )}
    />
  )
}
