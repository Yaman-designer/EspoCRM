'use client'

import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, RadioField as Schema, FieldOption } from '../types'

function CardOption({
  option,
  selected,
  onChange,
  disabled,
}: {
  option: FieldOption
  selected: boolean
  onChange: () => void
  disabled?: boolean
}) {
  const Icon = option.icon
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-ring/15 focus-within:ring-offset-1',
        selected
          ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
          : 'border-border/70 hover:border-primary/40 hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="radio"
        value={String(option.value)}
        checked={selected}
        onChange={onChange}
        disabled={disabled || option.disabled}
        className="sr-only"
      />
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />}
        <span className="text-sm font-medium">{option.label}</span>
        {selected && (
          <div className="ml-auto h-4 w-4 rounded-full border-2 border-primary bg-primary" aria-hidden />
        )}
      </div>
      {option.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">{option.description}</p>
      )}
    </label>
  )
}

export function RadioField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const opts = options ?? schema.options ?? []
  const layout = schema.layout ?? 'vertical'

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <fieldset
            id={getFieldId(schema.key)}
            disabled={disabled || readOnly}
            aria-invalid={!!fieldState.error}
          >
            {layout === 'card' ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {opts.map(opt => (
                  <CardOption
                    key={String(opt.value)}
                    option={opt}
                    selected={field.value === opt.value || field.value === String(opt.value)}
                    onChange={() => !readOnly && field.onChange(opt.value)}
                    disabled={disabled || opt.disabled}
                  />
                ))}
              </div>
            ) : layout === 'horizontal' ? (
              <div className="flex flex-wrap gap-2">
                {opts.map(opt => {
                  const isSelected = field.value === opt.value || field.value === String(opt.value)
                  const Icon = opt.icon
                  return (
                    <label
                      key={String(opt.value)}
                      className={cn(
                        'inline-flex cursor-pointer select-none items-center gap-2',
                        'rounded-full border px-4 py-3 sm:py-2',
                        'text-[13px] font-medium leading-none',
                        'transition-all duration-200 ease-out',
                        isSelected
                          ? [
                              'border-primary/50 bg-primary/10 text-primary',
                              'shadow-[0_0_0_3px_rgba(0,97,188,0.08),0_1px_4px_rgba(0,97,188,0.14)]',
                            ]
                          : [
                              'border-border/60 bg-card text-foreground/70',
                              'hover:border-border/80 hover:bg-muted/40 hover:text-foreground',
                            ],
                        (disabled || opt.disabled) && 'cursor-not-allowed opacity-45',
                      )}
                    >
                      <input
                        type="radio"
                        value={String(opt.value)}
                        checked={isSelected}
                        onChange={() => !readOnly && field.onChange(opt.value)}
                        disabled={disabled || opt.disabled}
                        className="sr-only"
                      />
                      {/* Selection dot */}
                      <span
                        className={cn(
                          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-border/60 bg-transparent',
                        )}
                        aria-hidden
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {Icon && (
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/60')} aria-hidden />
                      )}
                      {opt.label}
                    </label>
                  )
                })}
              </div>
            ) : (
              // Default (plain) layout — mirrors Pipeline's FormRadio exactly:
              // the shared ui/radio-group.tsx primitive, not a hand-rolled
              // native input. 'card'/'horizontal' above stay bespoke — they
              // have no Pipeline equivalent to converge to and aren't reached
              // by any current wizard schema, so left untouched here.
              <RadioGroup
                value={field.value != null ? String(field.value) : undefined}
                onValueChange={val => {
                  if (readOnly) return
                  const opt = opts.find(o => String(o.value) === val)
                  field.onChange(opt?.value ?? val)
                }}
                disabled={disabled || readOnly}
                className="gap-3"
              >
                {opts.map(opt => (
                  <div
                    key={String(opt.value)}
                    className={cn(
                      'flex items-start gap-2.5',
                      (disabled || opt.disabled) && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <RadioGroupItem
                      value={String(opt.value)}
                      id={`${getFieldId(schema.key)}-${opt.value}`}
                      disabled={disabled || opt.disabled}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`${getFieldId(schema.key)}-${opt.value}`}
                      className="flex-col items-start gap-0.5 font-normal cursor-pointer"
                    >
                      <span className="text-sm text-foreground">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs font-normal text-muted-foreground">{opt.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </fieldset>
        </FieldWrapper>
      )}
    />
  )
}
