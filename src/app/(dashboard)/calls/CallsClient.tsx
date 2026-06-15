'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { callsConfig } from '@/features/calls/config'

export function CallsClient() {
  return <CRMResourcePage config={callsConfig} />
}
