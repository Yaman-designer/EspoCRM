'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { contractsConfig } from '@/features/contracts/config'

export function ContractsClient() {
  return <CRMResourcePage config={contractsConfig} />
}
