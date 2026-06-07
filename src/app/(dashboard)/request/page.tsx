import type { Metadata } from 'next'
import { EntityCrudPage } from '@/components/crud/EntityCrudPage'
import { requestConfig } from '@/lib/entityConfigs'

export const metadata: Metadata = { title: 'Requests' }

export default function RequestPage() {
  return <EntityCrudPage config={requestConfig} />
}
