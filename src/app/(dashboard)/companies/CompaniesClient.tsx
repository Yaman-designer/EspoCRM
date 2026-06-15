'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { companiesConfig } from '@/features/companies/config'

export function CompaniesClient() {
  return <CRMResourcePage config={companiesConfig} />
}
