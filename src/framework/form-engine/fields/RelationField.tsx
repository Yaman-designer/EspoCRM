'use client'

import { useState, useCallback, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { ComboboxTrigger } from '@/components/ui/combobox-trigger'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, getFieldDescribedBy } from '../utils'
import type { FieldComponentProps, RelationField as Schema, FieldOption } from '../types'

export function RelationField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { t } = useTranslation('properties')
  const searchPlaceholder = schema.placeholderKey
    ? t(schema.placeholderKey)
    : t('wizard.common.searchPlaceholder', { label: schema.entity })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FieldOption[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const search = useCallback(
    async (query: string) => {
      if (!schema.searchEndpoint) return
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const params = new URLSearchParams({ q: query, entity: schema.entity })
          const res = await fetch(`${schema.searchEndpoint}?${params}`)
          if (!res.ok) return
          const data = await res.json() as { id: string; [key: string]: unknown }[]
          const displayKey = schema.displayField ?? 'name'
          setResults(data.map(r => ({
            value: r.id,
            label: String(r[displayKey] ?? r.id),
          })))
        } catch {
          setResults([])
        } finally {
          setLoading(false)
        }
      }, 300)
    },
    [schema],
  )

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const isMultiple = schema.multiple
        const selected: FieldOption[] = isMultiple
          ? (Array.isArray(field.value) ? field.value : []).map((v: FieldOption) =>
              typeof v === 'object' ? v : results.find(r => r.value === v) ?? { value: v, label: String(v) },
            )
          : []

        const selectSingle = (opt: FieldOption) => {
          field.onChange(isMultiple ? [...selected, opt] : opt)
          setOpen(false)
        }

        const removeSingle = (val: unknown) => {
          if (!isMultiple) { field.onChange(null); return }
          field.onChange(selected.filter(s => s.value !== val))
        }

        const displayValue = !isMultiple && field.value
          ? (typeof field.value === 'object'
              ? (field.value as FieldOption).label
              : String((field.value as FieldOption)?.label ?? field.value))
          : null

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            {/* Trigger shell + chevron now come from the shared ComboboxTrigger
                (same one AsyncSelectField/SearchableSelectField/MultiSelectField
                use) instead of a bespoke button — and, for multi mode, selected
                chips move below the trigger instead of wrapping inside it,
                mirroring MultiSelectField's/Pipeline's layout. */}
            <div className="space-y-2">
              <Popover open={open && !disabled && !readOnly} onOpenChange={o => { if (!disabled && !readOnly) setOpen(o) }}>
                <PopoverTrigger asChild>
                  <ComboboxTrigger
                    id={getFieldId(schema.key)}
                    disabled={disabled || readOnly}
                    error={!!fieldState.error}
                    open={open}
                    showChevron={!loading}
                    aria-describedby={getFieldDescribedBy(schema, fieldState.error?.message)}
                  >
                    {/* min-w-0 truncate on all 3 branches: see SelectField.tsx's
                        identical fix. `displayValue` in particular is a real
                        related record's name (contact/company/etc.) — no
                        bound on its length the way "N selected" has. */}
                    {isMultiple ? (
                      <span className={cn('min-w-0 truncate', selected.length > 0 ? 'text-foreground' : 'text-muted-foreground/50')}>
                        {selected.length > 0
                          ? t('wizard.common.selectedCount', { count: selected.length })
                          : searchPlaceholder}
                      </span>
                    ) : displayValue ? (
                      <span className="min-w-0 truncate text-foreground">{displayValue}</span>
                    ) : (
                      <span className="min-w-0 truncate text-muted-foreground/50">{searchPlaceholder}</span>
                    )}
                    <div className="ms-auto flex items-center gap-1">
                      {!isMultiple && field.value && (
                        // Real <button> can't nest inside ComboboxTrigger's
                        // own <button> — see SelectField.tsx for the same
                        // pattern/rationale.
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={e => { e.stopPropagation(); if (!readOnly) removeSingle(null) }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              e.stopPropagation()
                              if (!readOnly) removeSingle(null)
                            }
                          }}
                          aria-label={t('wizard.common.clearFieldSelection', { label: t(schema.labelKey) })}
                          className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <CommandInput placeholder={searchPlaceholder} onValueChange={search} />
                    <CommandList>
                      {loading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>
                            {schema.searchEndpoint ? t('wizard.common.noResultsFound') : t('wizard.common.noSearchEndpoint')}
                          </CommandEmpty>
                          <CommandGroup>
                            {results.map(opt => (
                              <CommandItem
                                key={String(opt.value)}
                                value={String(opt.value)}
                                onSelect={() => selectSingle(opt)}
                              >
                                <Check className={cn('mr-2 h-4 w-4 shrink-0',
                                  selected.some(s => s.value === opt.value) ? 'opacity-100 text-primary' : 'opacity-0'
                                )} />
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

              {isMultiple && selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map(opt => (
                    <Badge key={String(opt.value)} variant="secondary" className="gap-1 pe-1.5 text-[11px]">
                      {opt.label}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeSingle(opt.value) }}
                          className="-m-1 rounded-full p-1 text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          aria-label={t('wizard.common.removeOption', { label: opt.label })}
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </FieldWrapper>
        )
      }}
    />
  )
}
