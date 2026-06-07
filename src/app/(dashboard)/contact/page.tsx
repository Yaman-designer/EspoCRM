import type { Metadata } from 'next'
import { EntityCrudPage } from '@/components/crud/EntityCrudPage'
import { contactConfig } from '@/lib/entityConfigs'

export const metadata: Metadata = { title: 'Contacts' }

export default function ContactPage() {
  return <EntityCrudPage config={contactConfig} />
}
