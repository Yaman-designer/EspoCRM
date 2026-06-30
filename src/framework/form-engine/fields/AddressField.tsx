'use client'

import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, AddressField as Schema } from '../types'

const DEFAULT_FIELDS = { street: true, city: true, district: true, country: true, postalCode: false }

export function AddressField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const enabled = { ...DEFAULT_FIELDS, ...schema.fields }
  const k = schema.key

  return (
    <Controller
      control={form.control}
      name={k}
      rules={buildRules(schema, form.getValues)}
      render={({ fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div id={getFieldId(k)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {enabled.street && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor={`${getFieldId(k)}-street`} className="text-xs text-muted-foreground">Street Address</Label>
                <Input
                  id={`${getFieldId(k)}-street`}
                  {...form.register(`${k}.street`)}
                  placeholder="123 Main St"
                  disabled={disabled}
                  readOnly={readOnly}
                />
              </div>
            )}

            {enabled.city && (
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor={`${getFieldId(k)}-city`} className="text-xs text-muted-foreground">City</Label>
                <Input
                  id={`${getFieldId(k)}-city`}
                  {...form.register(`${k}.city`)}
                  placeholder="City"
                  disabled={disabled}
                  readOnly={readOnly}
                />
              </div>
            )}

            {enabled.district && (
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor={`${getFieldId(k)}-district`} className="text-xs text-muted-foreground">District / Area</Label>
                <Input
                  id={`${getFieldId(k)}-district`}
                  {...form.register(`${k}.district`)}
                  placeholder="District"
                  disabled={disabled}
                  readOnly={readOnly}
                />
              </div>
            )}

            {enabled.country && (
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor={`${getFieldId(k)}-country`} className="text-xs text-muted-foreground">Country</Label>
                <Input
                  id={`${getFieldId(k)}-country`}
                  {...form.register(`${k}.country`)}
                  placeholder="Country"
                  disabled={disabled}
                  readOnly={readOnly}
                />
              </div>
            )}

            {enabled.postalCode && (
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor={`${getFieldId(k)}-postalCode`} className="text-xs text-muted-foreground">Postal Code</Label>
                <Input
                  id={`${getFieldId(k)}-postalCode`}
                  {...form.register(`${k}.postalCode`)}
                  placeholder="00000"
                  disabled={disabled}
                  readOnly={readOnly}
                />
              </div>
            )}

          </div>
        </FieldWrapper>
      )}
    />
  )
}
