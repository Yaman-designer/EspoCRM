'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { ComboboxTrigger } from '@/components/ui/combobox-trigger'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, getFieldDescribedBy, resolveOptionLabel } from '../utils'
import type { FieldComponentProps, MultiSelectField as Schema, FieldOption } from '../types'

export function MultiSelectField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const [open, setOpen] = useState(false)
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
        const selected: (string | number | boolean)[] = Array.isArray(field.value) ? field.value : []
        const selectedOpts = selected.map(v => opts.find(o => o.value === v) ?? { value: v, label: String(v) })

        const toggle = (opt: FieldOption) => {
          if (readOnly || opt.disabled) return
          const exists = selected.some(v => v === opt.value)
          if (exists) {
            field.onChange(selected.filter(v => v !== opt.value))
          } else {
            if (schema.max && selected.length >= schema.max) return
            field.onChange([...selected, opt.value])
          }
        }

        const remove = (val: string | number | boolean, e: React.MouseEvent) => {
          e.stopPropagation()
          if (readOnly) return
          field.onChange(selected.filter(v => v !== val))
        }

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <div className="space-y-2">
              <Popover open={open && !disabled && !readOnly} onOpenChange={o => !disabled && !readOnly && setOpen(o)}>
                <PopoverTrigger asChild>
                  <ComboboxTrigger
                    id={getFieldId(schema.key)}
                    disabled={disabled || readOnly}
                    error={!!fieldState.error}
                    open={open}
                    aria-describedby={getFieldDescribedBy(schema, fieldState.error?.message)}
                  >
                    {/* min-w-0 truncate: see SelectField.tsx's identical fix.
                        "{count} selected" is normally short, but the
                        placeholder shown before anything's picked is real,
                        potentially-long translated copy. */}
                    <span className={cn('min-w-0 truncate', selectedOpts.length > 0 ? 'text-foreground' : 'text-muted-foreground/50')}>
                      {selectedOpts.length > 0
                        ? t('wizard.common.selectedCount', { count: selectedOpts.length })
                        : selectPlaceholder}
                    </span>
                  </ComboboxTrigger>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                  <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                      <CommandEmpty>{t('wizard.common.noOptionsFound')}</CommandEmpty>
                      <CommandGroup>
                        {opts.map(opt => {
                          const isSelected = selected.some(v => v === opt.value)
                          const optLabel = resolveOptionLabel(t, opt)
                          return (
                            <CommandItem
                              key={String(opt.value)}
                              value={String(opt.value) + optLabel}
                              onSelect={() => toggle(opt)}
                              disabled={opt.disabled || (!isSelected && !!schema.max && selected.length >= schema.max)}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', isSelected ? 'opacity-100 text-primary' : 'opacity-0')} />
                              {optLabel}
                              {opt.description && (
                                <span className="ml-1 text-xs text-muted-foreground">{opt.description}</span>
                              )}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedOpts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedOpts.map(opt => {
                    const optLabel = resolveOptionLabel(t, opt)
                    return (
                    <Badge key={String(opt.value)} variant="secondary" className="gap-1 pe-1.5 text-[11px]">
                      {optLabel}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={e => remove(opt.value, e)}
                          disabled={disabled}
                          // -m-1/p-1: widens the ~12px icon to a ~20px hit
                          // target (using the surrounding chip gap, not the
                          // badge's own padding) without changing the
                          // compact badge's visible size.
                          className="-m-1 rounded-full p-1 text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          aria-label={t('wizard.common.removeOption', { label: optLabel })}
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      )}
                    </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </FieldWrapper>
        )
      }}
    />
  )
}
