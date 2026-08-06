'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ComboboxTrigger } from '@/components/ui/combobox-trigger'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, getFieldDescribedBy } from '../utils'
import type { FieldComponentProps, DateField as Schema } from '../types'

// ── Date utilities (no date-fns dependency, matches components/dynamic-form/FormDatePicker) ──

function parseISODate(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined
  const iso = value.length > 10 ? value.substring(0, 10) : value
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

function toISODate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDisplay(value: unknown): string {
  const d = parseISODate(value)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function DateField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const [open, setOpen] = useState(false)
  const inputId = getFieldId(schema.key)
  const minDate = schema.min ? parseISODate(schema.min) : undefined
  const maxDate = schema.max ? parseISODate(schema.max) : undefined

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const date = parseISODate(field.value)
        const isDisabled = disabled || readOnly

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <ComboboxTrigger
                  id={inputId}
                  disabled={isDisabled}
                  open={open}
                  showChevron={false}
                  error={!!fieldState.error}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={getFieldDescribedBy(schema, fieldState.error?.message)}
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {/* min-w-0 truncate: see SelectField.tsx's identical fix.
                      A formatted date is normally short, but a long
                      translated placeholder (or a custom `formatDisplay`)
                      shouldn't be assumed to always fit. */}
                  <span className={cn('min-w-0 truncate', !date ? 'text-muted-foreground/50' : 'text-foreground')}>
                    {date
                      ? formatDisplay(field.value)
                      : (schema.placeholderKey ? t(schema.placeholderKey) : t('wizard.common.pickDate'))}
                  </span>
                </ComboboxTrigger>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  disabled={(d) => (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false)}
                  onSelect={(d) => {
                    field.onChange(d ? toISODate(d) : '')
                    setOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </FieldWrapper>
        )
      }}
    />
  )
}
