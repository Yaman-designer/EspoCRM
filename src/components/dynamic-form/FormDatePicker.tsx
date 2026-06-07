'use client'

import { useState } from 'react'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FieldConfig } from './types'

// ── Date utilities (no date-fns dependency) ────────────────────────────────────

function parseISODate(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined
  // Normalize "YYYY-MM-DD HH:MM:SS" (from EspoCRM) to ISO format before parsing
  const iso = value.length > 10 ? value.substring(0, 10) : value
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

function toISODate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDisplay(value: unknown): string {
  const d = parseISODate(value)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Component ──────────────────────────────────────────────────────────────────

interface FormDatePickerProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormDatePicker({ field, config }: FormDatePickerProps) {
  const [open, setOpen] = useState(false)
  const date = parseISODate(field.value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={config.disabled}
          className={cn(
            'h-10 w-full justify-start border-border/60 bg-background text-left text-sm font-normal shadow-none transition-colors hover:border-border hover:bg-muted/30',
            !date ? 'text-muted-foreground/70' : 'text-foreground',
            (config.disabled || config.readOnly) && 'pointer-events-none opacity-60',
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          {date ? formatDisplay(field.value) : (config.placeholder ?? 'Pick a date…')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            field.onChange(d ? toISODate(d) : '')
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
