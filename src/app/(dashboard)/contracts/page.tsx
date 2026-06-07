import type { Metadata } from 'next'
import { EntityCrudPage } from '@/components/crud/EntityCrudPage'
import { contractConfig } from '@/lib/entityConfigs'

export const metadata: Metadata = { title: 'Contracts' }

export default function ContractsPage() {
  return <EntityCrudPage config={contractConfig} />
}
