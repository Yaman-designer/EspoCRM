'use client'

import { Controller } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, CheckboxField as Schema } from '../types'

export function CheckboxField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const inputId = getFieldId(schema.key)

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="flex items-start gap-3 pt-1">
            <Checkbox
              id={inputId}
              checked={!!field.value}
              onCheckedChange={readOnly ? undefined : field.onChange}
              disabled={disabled || readOnly}
              aria-invalid={!!fieldState.error}
            />
            {schema.checkboxLabel && (
              <Label
                htmlFor={inputId}
                className="cursor-pointer text-sm leading-relaxed text-foreground/80"
              >
                {schema.checkboxLabel}
              </Label>
            )}
          </div>
        </FieldWrapper>
      )}
    />
  )
}
