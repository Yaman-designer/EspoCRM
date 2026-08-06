'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { ComboboxTrigger } from '@/components/ui/combobox-trigger'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, SearchableSelectField as Schema } from '../types'

export function SearchableSelectField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const [open, setOpen] = useState(false)
  const [creatableInput, setCreatableInput] = useState('')
  const opts = options ?? schema.options ?? []
  const label = t(schema.labelKey).toLowerCase()
  const selectPlaceholder = schema.placeholderKey ? t(schema.placeholderKey) : t('wizard.common.selectPlaceholder', { label })
  const searchPlaceholder = t('wizard.common.searchPlaceholder', { label })

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const selectedOpt = opts.find(o => o.value === field.value || String(o.value) === String(field.value))
        const displayLabel = selectedOpt?.label ?? (field.value != null ? String(field.value) : null)

        const select = (val: string | number | boolean, label?: string) => {
          if (readOnly) return
          field.onChange(val)
          setOpen(false)
          setCreatableInput('')
        }

        const clear = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (readOnly) return
          field.onChange(null)
        }

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <Popover open={open && !disabled && !readOnly} onOpenChange={o => !disabled && !readOnly && setOpen(o)}>
              <PopoverTrigger asChild>
                <ComboboxTrigger
                  id={getFieldId(schema.key)}
                  disabled={disabled || readOnly}
                  error={!!fieldState.error}
                  open={open}
                >
                  {/* min-w-0 truncate: see SelectField.tsx's identical fix for
                      why this has to sit on this span specifically, not just
                      rely on ComboboxTrigger's own wrapper truncate. */}
                  <span className={cn('min-w-0 truncate', displayLabel ? 'text-foreground' : 'text-muted-foreground/50')}>
                    {displayLabel ?? selectPlaceholder}
                  </span>
                  {schema.clearable && field.value != null && (
                    <span
                      onClick={clear}
                      className="ms-auto text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </ComboboxTrigger>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command>
                  <CommandInput
                    placeholder={searchPlaceholder}
                    onValueChange={schema.creatable ? setCreatableInput : undefined}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {schema.creatable && creatableInput ? (
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-start text-sm hover:bg-muted"
                          onClick={() => select(creatableInput)}
                        >
                          {t('wizard.common.createOption', { value: creatableInput })}
                        </button>
                      ) : (
                        t('wizard.common.noOptionsFound')
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {opts.map(opt => (
                        <CommandItem
                          key={String(opt.value)}
                          value={String(opt.value) + opt.label}
                          onSelect={() => select(opt.value)}
                          disabled={opt.disabled}
                        >
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', String(field.value) === String(opt.value) ? 'opacity-100 text-primary' : 'opacity-0')} />
                          {opt.label}
                          {opt.description && (
                            <span className="ml-1 text-xs text-muted-foreground">{opt.description}</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldWrapper>
        )
      }}
    />
  )
}
