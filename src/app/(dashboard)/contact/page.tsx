import type { Metadata } from 'next'
import { ContactClient } from './ContactClient'

export const metadata: Metadata = { title: 'Contacts' }

export default function ContactPage() {
  return <ContactClient />
}
