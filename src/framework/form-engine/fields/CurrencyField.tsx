'use client'

import { Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, CurrencyField as Schema } from '../types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', SAR: 'SAR', AED: 'AED',
  KWD: 'KWD', QAR: 'QAR', BHD: 'BHD', OMR: 'OMR', EGP: 'EGP',
}

export function CurrencyField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  // Always call useWatch — conditionally use the result.
  // Using a sentinel key avoids conditional hook call.
  const watchedCurrency = useWatch({
    control: form.control,
    name: schema.currencyField ?? '__fe_no_currency_field__',
  }) as string | undefined

  const code = (schema.currencyField ? watchedCurrency : undefined) ?? schema.currencyCode ?? 'SAR'
  const symbol = CURRENCY_SYMBOLS[code] ?? code

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-muted-foreground min-w-8">
              {symbol}
            </span>
            <Input
              {...field}
              id={getFieldId(schema.key)}
              value={field.value ?? ''}
              type="number"
              placeholder={schema.placeholder ?? '0.00'}
              disabled={disabled}
              readOnly={readOnly}
              min={schema.min ?? 0}
              max={schema.max}
              step={schema.precision != null ? Math.pow(10, -schema.precision) : 0.01}
              inputMode="decimal"
              aria-invalid={!!fieldState.error}
              onChange={e => {
                const val = e.target.value
                field.onChange(val === '' ? undefined : Number(val))
              }}
              className="pl-12"
            />
          </div>
        </FieldWrapper>
      )}
    />
  )
}
