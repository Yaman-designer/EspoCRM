import type { Metadata } from 'next'
import { CallsClient } from './CallsClient'

export const metadata: Metadata = { title: 'Calls' }

export default function CallsPage() {
  return <CallsClient />
}
