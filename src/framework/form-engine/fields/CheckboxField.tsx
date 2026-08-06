'use client'

import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, CheckboxField as Schema } from '../types'

export function CheckboxField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const inputId = getFieldId(schema.key)
  const label = schema.checkboxLabelKey ? t(schema.checkboxLabelKey) : (schema.labelKey ? t(schema.labelKey) : '')
  const description = schema.descriptionKey ? t(schema.descriptionKey) : ''

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="flex items-start gap-3">
            <Checkbox
              id={inputId}
              checked={!!field.value}
              onCheckedChange={readOnly ? undefined : field.onChange}
              disabled={disabled || readOnly}
              aria-invalid={!!fieldState.error}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor={inputId} className="cursor-pointer text-sm font-medium leading-snug">
                {label}
                {schema.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {description && (
                <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </FieldWrapper>
      )}
    />
  )
}
