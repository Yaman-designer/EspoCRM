'use client'

import { useState, useCallback, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, RelationField as Schema, FieldOption } from '../types'

export function RelationField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
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
            <Popover open={open && !disabled && !readOnly} onOpenChange={o => { if (!disabled && !readOnly) setOpen(o) }}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id={getFieldId(schema.key)}
                  disabled={disabled}
                  aria-invalid={!!fieldState.error}
                  className={cn(
                    'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm',
                    'hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    open && 'ring-2 ring-ring',
                    (disabled || readOnly) && 'cursor-not-allowed opacity-50',
                    fieldState.error && 'border-destructive',
                  )}
                >
                  {isMultiple ? (
                    selected.length ? (
                      selected.map(opt => (
                        <Badge key={String(opt.value)} variant="secondary" className="flex items-center gap-1 pr-1">
                          {opt.label}
                          {!readOnly && (
                            <button type="button" onClick={e => { e.stopPropagation(); removeSingle(opt.value) }}>
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">{schema.placeholder ?? `Search ${schema.entity}…`}</span>
                    )
                  ) : displayValue ? (
                    <span className="flex-1">{displayValue}</span>
                  ) : (
                    <span className="text-muted-foreground flex-1">{schema.placeholder ?? `Search ${schema.entity}…`}</span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    {!isMultiple && field.value && (
                      <span onClick={e => { e.stopPropagation(); if (!readOnly) removeSingle(null) }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-50" /> : <ChevronsUpDown className="h-4 w-4 opacity-40" />}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder={`Search ${schema.entity}…`} onValueChange={search} />
                  <CommandList>
                    {loading ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>
                          {schema.searchEndpoint ? 'No results found.' : 'No search endpoint configured.'}
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
          </FieldWrapper>
        )
      }}
    />
  )
}
