'use client'

import { Controller } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, SwitchField as Schema } from '../types'

export function SwitchField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const isOn = !!field.value

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <div className="flex items-center gap-3 pt-0.5">
              <Switch
                id={getFieldId(schema.key)}
                checked={isOn}
                onCheckedChange={readOnly ? undefined : field.onChange}
                disabled={disabled || readOnly}
                aria-invalid={!!fieldState.error}
              />
              {(schema.onLabel || schema.offLabel) && (
                <span
                  className={cn(
                    'text-sm transition-colors duration-200',
                    isOn ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {isOn ? (schema.onLabel ?? 'On') : (schema.offLabel ?? 'Off')}
                </span>
              )}
            </div>
          </FieldWrapper>
        )
      }}
    />
  )
}
