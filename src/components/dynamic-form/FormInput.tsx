'use client'

import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import type { FieldConfig } from './types'

interface FormInputProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormInput({ field, config }: FormInputProps) {
  const { type, placeholder, disabled, readOnly, min, max, step, maxLength, currency, presets, suffix } = config

  if (type === 'currency') {
    const symbol = currency?.length === 1 ? currency : '$'
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {symbol}
        </span>
        <Input
          type="number"
          min={min ?? 0}
          step={step ?? 1000}
          placeholder="0"
          disabled={disabled}
          readOnly={readOnly}
          className="h-10 pl-7"
          {...field}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(Math.max(0, Number(e.target.value)))}
        />
      </div>
    )
  }

  if (type === 'number' && presets?.length) {
    const currentValue = Number(field.value ?? 0)
    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            placeholder={placeholder ?? '0'}
            disabled={disabled}
            readOnly={readOnly}
            className={cn('h-10', suffix ? 'pr-8' : undefined)}
            {...field}
            value={field.value ?? ''}
            onChange={(e) => {
              const v = Number(e.target.value)
              field.onChange(
                min !== undefined && max !== undefined
                  ? Math.min(max, Math.max(min, v))
                  : v,
              )
            }}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled || readOnly}
              onClick={() => field.onChange(p)}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                currentValue === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-50',
              )}
            >
              {p}{suffix ?? ''}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const inputType =
    type === 'email'    ? 'email'    :
    type === 'password' ? 'password' :
    type === 'number'   ? 'number'   :
    type === 'phone'    ? 'tel'      :
    type === 'time'     ? 'time'     :
    'text'

  return (
    <div className={suffix ? 'relative' : undefined}>
      <Input
        type={inputType}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        className={cn('h-10', suffix ? 'pr-8' : undefined)}
        {...field}
        value={field.value ?? ''}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  )
}
