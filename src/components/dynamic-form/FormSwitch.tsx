'use client'

import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { FieldConfig } from './types'

interface Props {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormSwitch({ field, config }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <Switch
        id={field.name}
        checked={!!field.value}
        onCheckedChange={field.onChange}
        disabled={config.disabled}
      />
      <div className="flex-1">
        <Label htmlFor={field.name} className="cursor-pointer text-sm font-medium leading-none">
          {config.label}
          {config.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {config.description && (
          <p className="mt-1 text-[12px] text-muted-foreground">{config.description}</p>
        )}
      </div>
    </div>
  )
}

export function FormCheckbox({ field, config }: Props) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={field.name}
        checked={!!field.value}
        onCheckedChange={field.onChange}
        disabled={config.disabled}
        className="mt-0.5"
      />
      <div className="flex-1">
        <Label htmlFor={field.name} className="cursor-pointer text-sm font-medium leading-snug">
          {config.label}
          {config.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {config.description && (
          <p className="mt-1 text-[12px] text-muted-foreground">{config.description}</p>
        )}
      </div>
    </div>
  )
}

export function FormRadio({ field, config }: Props) {
  const options = config.options ?? []
  return (
    <RadioGroup
      value={field.value ?? ''}
      onValueChange={field.onChange}
      disabled={config.disabled}
      className="space-y-2"
    >
      {options.map((opt) => (
        <div key={opt.value} className="flex items-center gap-3">
          <RadioGroupItem
            value={opt.value}
            id={`${field.name}-${opt.value}`}
            disabled={opt.disabled}
          />
          <Label
            htmlFor={`${field.name}-${opt.value}`}
            className="cursor-pointer text-sm font-normal"
          >
            {opt.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
