'use client'

import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import type { FieldConfig } from './types'
import { FormInput } from './FormInput'
import { FormTextarea } from './FormTextarea'
import { FormSelect, FormMultiSelect } from './FormSelect'
import { FormSwitch, FormCheckbox, FormRadio } from './FormSwitch'
import { FormDatePicker } from './FormDatePicker'
import { FormTags } from './FormTags'
import { FormUploader } from './FormUploader'
import { FormRichText } from './FormRichText'

interface FieldRendererProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FieldRenderer({ field, config }: FieldRendererProps) {
  switch (config.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
    case 'phone':
    case 'currency':
    case 'time':
      return <FormInput field={field} config={config} />

    case 'textarea':
      return <FormTextarea field={field} config={config} />

    case 'select':
    case 'async-select':
    case 'status':
      return <FormSelect field={field} config={config} />

    case 'multi-select':
      return <FormMultiSelect field={field} config={config} />

    case 'switch':
      return <FormSwitch field={field} config={config} />

    case 'checkbox':
      return <FormCheckbox field={field} config={config} />

    case 'radio':
      return <FormRadio field={field} config={config} />

    case 'date':
      return <FormDatePicker field={field} config={config} />

    case 'file':
    case 'image':
      return <FormUploader field={field} config={config} />

    case 'rich-text':
      return <FormRichText field={field} config={config} />

    case 'tags':
      return <FormTags field={field} config={config} />

    default:
      return <FormInput field={field} config={config} />
  }
}
