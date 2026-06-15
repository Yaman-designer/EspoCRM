'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { propertiesConfig } from '@/features/properties/config'

export function PropertiesClient() {
  return <CRMResourcePage config={propertiesConfig} />
}
