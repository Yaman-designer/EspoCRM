'use client'

import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, getFieldDescribedBy } from '../utils'
import type { FieldComponentProps, SwitchField as Schema } from '../types'

export function SwitchField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const inputId = getFieldId(schema.key)
  const label = schema.labelKey ? t(schema.labelKey) : ''
  const description = schema.descriptionKey ? t(schema.descriptionKey) : ''

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const isOn = !!field.value

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            {/* Visual QA F-04: off-state previously used the same faint
                border/background regardless of checked state, reading as
                disabled rather than "off but interactive." On now gets a
                distinct primary tint; off keeps a fully-opaque (not /60)
                border so it doesn't fade into the disabled-field register.
                Design-System pass: brought up to the same rounded-xl/
                shadow/hover tokens every other control in the system uses
                (see project-form-component-system) — this card was still on
                the pre-Phase-3 rounded-lg/flat-border treatment, reading a
                size class lighter and a hair cramped next to its peers. */}
            <div className={cn(
              'flex items-center gap-4 rounded-xl border px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200',
              isOn
                ? 'border-primary/30 bg-primary/6'
                : 'border-border/70 bg-muted/25 hover:border-border hover:bg-muted/35',
            )}>
              <Switch
                id={inputId}
                checked={isOn}
                onCheckedChange={readOnly ? undefined : field.onChange}
                disabled={disabled || readOnly}
                aria-invalid={!!fieldState.error}
                aria-describedby={getFieldDescribedBy(schema, fieldState.error?.message)}
              />
              <div className="flex-1">
                <Label htmlFor={inputId} className="cursor-pointer text-sm font-medium leading-none">
                  {label}
                  {schema.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                {description && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
                )}
              </div>
              {(schema.onLabelKey || schema.offLabelKey) && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide transition-colors duration-200',
                    isOn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/65',
                  )}
                >
                  {isOn
                    ? (schema.onLabelKey ? t(schema.onLabelKey) : t('wizard.common.on'))
                    : (schema.offLabelKey ? t(schema.offLabelKey) : t('wizard.common.off'))}
                </span>
              )}
            </div>
          </FieldWrapper>
        )
      }}
    />
  )
}
