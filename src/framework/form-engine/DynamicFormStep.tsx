'use client'

import type { UseFormReturn } from 'react-hook-form'
import { FormStep } from '@/components/form-framework/FormStep'
import { DynamicForm } from './DynamicForm'
import type { StepSchema } from './types'

interface DynamicFormStepProps {
  /** Must match a StepConfig.id in the FormFramework config */
  id: string
  schema: StepSchema
  form: UseFormReturn<any>
  /** User permission keys for field-level access control */
  permissions?: string[]
}

/**
 * Drop-in replacement for `<FormStep id="…"><ManualFields /></FormStep>`.
 * Renders a schema-driven DynamicForm inside the existing FormStep marker
 * without touching the FormFramework or its Stepper.
 *
 * ```tsx
 * <FormFramework config={config} form={form} onSubmit={handleSubmit}>
 *   <DynamicFormStep id="basics"  schema={basicSchema}  form={form} />
 *   <DynamicFormStep id="details" schema={detailSchema} form={form} />
 *   <FormStep id="review">
 *     <ReviewPanel form={form} />
 *   </FormStep>
 * </FormFramework>
 * ```
 */
export function DynamicFormStep({ id, schema, form, permissions }: DynamicFormStepProps) {
  return (
    <FormStep id={id}>
      <DynamicForm schema={schema} form={form} permissions={permissions} />
    </FormStep>
  )
}
