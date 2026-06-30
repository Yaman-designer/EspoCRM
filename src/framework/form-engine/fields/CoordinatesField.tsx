'use client'

import { Controller } from 'react-hook-form'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, CoordinatesField as Schema } from '../types'

interface CoordValue {
  lat?: number | null
  lng?: number | null
}

export function CoordinatesField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const val: CoordValue = (field.value as CoordValue) ?? {}

        const update = (key: 'lat' | 'lng', raw: string) => {
          const num = raw === '' ? null : Number(raw)
          field.onChange({ ...val, [key]: num })
        }

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <div className="space-y-3" id={getFieldId(schema.key)}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    type="number"
                    value={val.lat ?? ''}
                    onChange={e => update('lat', e.target.value)}
                    placeholder="-90 to 90"
                    min={-90}
                    max={90}
                    step="any"
                    disabled={disabled}
                    readOnly={readOnly}
                    inputMode="decimal"
                    aria-invalid={!!fieldState.error}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    type="number"
                    value={val.lng ?? ''}
                    onChange={e => update('lng', e.target.value)}
                    placeholder="-180 to 180"
                    min={-180}
                    max={180}
                    step="any"
                    disabled={disabled}
                    readOnly={readOnly}
                    inputMode="decimal"
                    aria-invalid={!!fieldState.error}
                  />
                </div>
              </div>

              {/* Coordinates display */}
              {val.lat != null && val.lng != null && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                  <span>
                    {val.lat.toFixed(6)}, {val.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </FieldWrapper>
        )
      }}
    />
  )
}
