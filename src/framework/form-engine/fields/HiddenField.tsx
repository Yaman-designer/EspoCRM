'use client'

import { useEffect } from 'react'
import type { FieldComponentProps, HiddenField as Schema } from '../types'

export function HiddenField({ schema, form }: FieldComponentProps<Schema>) {
  useEffect(() => {
    if (schema.value !== undefined) {
      form.setValue(schema.key, schema.value)
    }
  }, [schema.key, schema.value, form])

  return null
}
