'use client'

import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import type { FieldConfig } from './types'

interface FormTextareaProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormTextarea({ field, config }: FormTextareaProps) {
  return (
    <Textarea
      rows={config.rows ?? 4}
      placeholder={config.placeholder}
      disabled={config.disabled}
      readOnly={config.readOnly}
      maxLength={config.maxLength}
      className="resize-none [field-sizing:normal]"
      {...field}
      value={field.value ?? ''}
    />
  )
}
