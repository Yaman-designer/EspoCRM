'use client'

import { useState, useCallback, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, AsyncSelectField as Schema, FieldOption } from '../types'

export function AsyncSelectField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
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
                <button
                  type="button"
                  id={getFieldId(schema.key)}
                  disabled={disabled}
                  aria-invalid={!!fieldState.error}
                  className={cn(
                    'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm',
                    'hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    open && 'ring-2 ring-ring',
                    (disabled || readOnly) && 'cursor-not-allowed opacity-50',
                    fieldState.error && 'border-destructive',
                  )}
                >
                  <span className={selectedOpt ? 'text-foreground' : 'text-muted-foreground'}>
                    {selectedOpt?.label ?? schema.placeholder ?? `Search ${schema.label.toLowerCase()}…`}
                  </span>
                  <div className="flex items-center gap-1">
                    {schema.clearable && field.value != null && (
                      <span
                        onClick={e => { e.stopPropagation(); if (!readOnly) field.onChange(null) }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-50" /> : <ChevronsUpDown className="h-4 w-4 opacity-40" />}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={`Search ${schema.label.toLowerCase()}…`}
                    onValueChange={search}
                  />
                  <CommandList>
                    {loading ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No results found.</CommandEmpty>
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
