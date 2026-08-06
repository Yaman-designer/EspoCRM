'use client'

import { useState, useCallback, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { ComboboxTrigger } from '@/components/ui/combobox-trigger'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, AsyncSelectField as Schema, FieldOption } from '../types'

export function AsyncSelectField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const searchPlaceholder = schema.placeholderKey
    ? t(schema.placeholderKey)
    : t('wizard.common.searchPlaceholder', { label: t(schema.labelKey).toLowerCase() })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [asyncOpts, setAsyncOpts] = useState<FieldOption[]>(
    Array.isArray(schema.defaultOptions) ? schema.defaultOptions : [],
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cacheRef = useRef<Map<string, FieldOption[]>>(new Map())

  const search = useCallback(
    (query: string) => {
      clearTimeout(debounceRef.current)

      if (schema.cacheOptions && cacheRef.current.has(query)) {
        setAsyncOpts(cacheRef.current.get(query)!)
        return
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const opts = await schema.loadOptions(query, {})
          if (schema.cacheOptions) cacheRef.current.set(query, opts)
          setAsyncOpts(opts)
        } finally {
          setLoading(false)
        }
      }, schema.debounce ?? 300)
    },
    [schema],
  )

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const selectedOpt = asyncOpts.find(o => o.value === field.value || String(o.value) === String(field.value))

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <Popover
              open={open && !disabled && !readOnly}
              onOpenChange={o => {
                if (disabled || readOnly) return
                setOpen(o)
                if (o && schema.defaultOptions === true) search('')
              }}
            >
              <PopoverTrigger asChild>
                <ComboboxTrigger
                  id={getFieldId(schema.key)}
                  disabled={disabled || readOnly}
                  error={!!fieldState.error}
                  open={open}
                  showChevron={!loading}
                >
                  {/* min-w-0 truncate: see SelectField.tsx's identical fix —
                      the actual overflowing text lives here, not in
                      ComboboxTrigger's own wrapper span. */}
                  <span className={cn('min-w-0 truncate', selectedOpt ? 'text-foreground' : 'text-muted-foreground/50')}>
                    {selectedOpt?.label ?? searchPlaceholder}
                  </span>
                  <div className="ms-auto flex items-center gap-1">
                    {schema.clearable && field.value != null && (
                      <span
                        onClick={e => { e.stopPropagation(); if (!readOnly) field.onChange(null) }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" />}
                  </div>
                </ComboboxTrigger>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={searchPlaceholder}
                    onValueChange={search}
                  />
                  <CommandList>
                    {loading ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>{t('wizard.common.noResultsFound')}</CommandEmpty>
                        <CommandGroup>
                          {asyncOpts.map(opt => (
                            <CommandItem
                              key={String(opt.value)}
                              value={String(opt.value)}
                              onSelect={() => { field.onChange(opt.value); setOpen(false) }}
                              disabled={opt.disabled}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === opt.value ? 'opacity-100 text-primary' : 'opacity-0')} />
                              {opt.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
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
