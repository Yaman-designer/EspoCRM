import type { Metadata } from 'next'
import { EntityCrudPage } from '@/components/crud/EntityCrudPage'
import { callConfig } from '@/lib/entityConfigs'

export const metadata: Metadata = { title: 'Calls' }

export default function CallsPage() {
  return <EntityCrudPage config={callConfig} />
}
