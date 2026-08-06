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
import { getFieldId, getFieldDescribedBy, resolveOptionLabel } from '../utils'
import type { FieldComponentProps, SelectField as Schema } from '../types'

export function SelectField({ schema, form, disabled, readOnly, options, optionsLoading }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const [open, setOpen] = useState(false)
  const opts = options ?? schema.options ?? []
  const label = t(schema.labelKey).toLowerCase()
  // C2 fix: while a reload-options fetch is in flight, GridEngine already
  // forces this field disabled — this placeholder swap is what tells the
  // user *why* ("Loading…"), instead of showing the normal placeholder as
  // if the field just hasn't been touched yet.
  const selectPlaceholder = optionsLoading
    ? t('wizard.common.loadingOptions')
    : schema.placeholderKey ? t(schema.placeholderKey) : t('wizard.common.selectPlaceholder', { label })
  const searchPlaceholder = t('wizard.common.searchPlaceholder', { label })

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const selectedOpt = opts.find(o => o.value === field.value || String(o.value) === String(field.value))
        const displayLabel = selectedOpt ? resolveOptionLabel(t, selectedOpt) : (field.value != null ? String(field.value) : null)

        const select = (val: string | number | boolean) => {
          if (readOnly) return
          field.onChange(val)
          setOpen(false)
        }

        const clear = () => {
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
                  aria-describedby={getFieldDescribedBy(schema, fieldState.error?.message)}
                >
                  {/* `min-w-0 truncate`: without this, a long selected value
                      hard-clips mid-word with no ellipsis. ComboboxTrigger's
                      own wrapper already has `truncate`, but that's a flex
                      container whose overflow comes from THIS child's box —
                      `text-overflow:ellipsis` doesn't propagate through a
                      nested element's own boundary, it only affects a
                      container's own inline content. The actual overflowing
                      text lives here, so this is where truncation has to be
                      applied. `min-w-0` (not `flex-1`): this span is a flex
                      item of that wrapper and only needs freedom to shrink
                      below its content size, not to grow — growing would
                      contend with the sibling clear button's `ms-auto`. */}
                  <span className={cn('min-w-0 truncate', displayLabel ? 'text-foreground' : 'text-muted-foreground/50')}>
                    {displayLabel ?? selectPlaceholder}
                  </span>
                  {schema.clearable && field.value != null && (
                    // Real <button> can't nest inside ComboboxTrigger's own
                    // <button> (invalid HTML — nested interactive controls),
                    // so this gets explicit button semantics instead of a
                    // bare onClick span: keyboard-operable (Enter/Space) and
                    // announced as a button, not just clickable-by-mouse.
                    // -m-1/p-1 widens the ~14px icon to a ~30px hit target
                    // without shifting its visual position in the row.
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); clear() }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          clear()
                        }
                      }}
                      aria-label={t('wizard.common.clearFieldSelection', { label: t(schema.labelKey) })}
                      className="-m-1 ms-auto rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </ComboboxTrigger>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{t('wizard.common.noOptionsFound')}</CommandEmpty>
                    <CommandGroup>
                      {opts.map(opt => {
                        const optLabel = resolveOptionLabel(t, opt)
                        return (
                        <CommandItem
                          key={String(opt.value)}
                          value={String(opt.value) + optLabel}
                          onSelect={() => select(opt.value)}
                          disabled={opt.disabled}
                        >
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', String(field.value) === String(opt.value) ? 'opacity-100 text-primary' : 'opacity-0')} />
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
          </FieldWrapper>
        )
      }}
    />
  )
}
