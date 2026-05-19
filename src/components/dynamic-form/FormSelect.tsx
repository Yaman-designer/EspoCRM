'use client'

import { useState } from 'react'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { ChevronsUpDown, Loader2, X } from 'lucide-react'
import axiosClient from '@/api/axiosClient'
import { resourceRegistry } from '@/shared/registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FieldConfig, SelectOption } from './types'

// ── Internal hook: resolves options ───────────────────────────────────────────
//
// Resolution order:
//   resource:  registry owns mapping → always returns {label, value}[]
//   api:       field config provides labelKey/valueKey for raw-row mapping
//   options:   static array, no network call
//
// fetchEnabled latches to true on first combobox open.
// After the first fetch React Query caches — subsequent opens are instant.

function useAsyncOptions(config: FieldConfig, fetchEnabled: boolean) {
  const resourceDef = config.resource ? resourceRegistry[config.resource] : undefined
  const isAsync = !!(resourceDef || config.api)
  // Don't fire any API call if there is no auth token — avoids guaranteed 401s
  const hasToken = !!Cookies.get('espo-token')

  const { data, isLoading, isError } = useQuery<SelectOption[]>({
    queryKey: resourceDef
      ? resourceDef.queryKey
      : ['dynamic-select', config.api],
    queryFn: resourceDef
      // Registry already returns normalised {label, value}[] — nothing more to do.
      ? resourceDef.queryFn
      // Custom api: path — caller must provide labelKey/valueKey for their raw rows.
      : async () => {
          const res = await axiosClient.get<{ data: Record<string, unknown>[] }>(config.api!)
          const lk = config.labelKey ?? 'label'
          const vk = config.valueKey ?? 'value'
          return res.data.data.map((item) => ({
            label: String(item[lk] ?? ''),
            value: String(item[vk] ?? ''),
          }))
        },
    enabled: isAsync && fetchEnabled && hasToken,
    staleTime: resourceDef?.staleTime ?? 5 * 60 * 1000,
    retry: 0,
  })

  return {
    options: data ?? config.options ?? [],
    isLoading: isLoading && isAsync,
    isError: isError && isAsync,
  }
}

// ── Shared props ───────────────────────────────────────────────────────────────

interface SelectProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

// ── Single Select — searchable combobox ───────────────────────────────────────

export function FormSelect({ field, config }: SelectProps) {
  const [open, setOpen] = useState(false)
  // fetchEnabled latches to true on first open and never goes back
  const [fetchEnabled, setFetchEnabled] = useState(false)

  const { options, isLoading, isError } = useAsyncOptions(config, fetchEnabled)

  const selected = options.find((o) => o.value === field.value)
  const placeholder = config.placeholder ?? `Select ${config.label.toLowerCase()}…`

  function handleOpenChange(next: boolean) {
    if (next) setFetchEnabled(true)
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={config.disabled || config.readOnly}
          className="h-9 w-full justify-between border-border/60 font-normal text-sm"
        >
          <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-full min-w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command
          filter={(value, search) => {
            const label = options.find((o) => o.value === value)?.label ?? ''
            return label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder="Search…" className="h-9" />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </div>
            ) : isError ? (
              <div className="py-4 text-center text-[12px] text-destructive">
                Failed to load options.
              </div>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      data-checked={field.value === opt.value ? 'true' : undefined}
                      disabled={opt.disabled}
                      onSelect={() => {
                        field.onChange(opt.value)
                        setOpen(false)
                      }}
                    >
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
  )
}

// ── Multi Select ──────────────────────────────────────────────────────────────

export function FormMultiSelect({ field, config }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [fetchEnabled, setFetchEnabled] = useState(false)

  const { options, isLoading, isError } = useAsyncOptions(config, fetchEnabled)
  const selected: string[] = Array.isArray(field.value) ? field.value : []

  function toggle(value: string) {
    field.onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    )
  }

  function remove(value: string) {
    field.onChange(selected.filter((v) => v !== value))
  }

  function handleOpenChange(next: boolean) {
    if (next) setFetchEnabled(true)
    setOpen(next)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={config.disabled || config.readOnly}
            className="h-9 w-full justify-between border-border/60 font-normal text-sm"
          >
            <span className={selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
              {selected.length > 0
                ? `${selected.length} selected`
                : (config.placeholder ?? `Select ${config.label.toLowerCase()}…`)}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-full min-w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command
            filter={(value, search) => {
              const label = options.find((o) => o.value === value)?.label ?? ''
              return label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }}
          >
            <CommandInput placeholder="Search…" className="h-9" />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading…
                </div>
              ) : isError ? (
                <div className="py-4 text-center text-[12px] text-destructive">
                  Failed to load options.
                </div>
              ) : (
                <>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        data-checked={selected.includes(opt.value) ? 'true' : undefined}
                        onSelect={() => toggle(opt.value)}
                        disabled={opt.disabled}
                      >
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

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v) => {
            const label = options.find((o) => o.value === v)?.label ?? v
            return (
              <Badge key={v} variant="secondary" className="gap-1 text-[11px]">
                {label}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  disabled={config.disabled}
                  className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
