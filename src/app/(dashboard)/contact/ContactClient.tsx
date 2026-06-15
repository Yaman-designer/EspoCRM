'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { contactsConfig } from '@/features/contact/config'

export function ContactClient() {
  return <CRMResourcePage config={contactsConfig} />
}
