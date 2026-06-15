'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { requestsConfig } from '@/features/requests/config'

export function RequestClient() {
  return <CRMResourcePage config={requestsConfig} />
}
