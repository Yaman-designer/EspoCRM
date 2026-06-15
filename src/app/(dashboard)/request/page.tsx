import type { Metadata } from 'next'
import { RequestClient } from './RequestClient'

export const metadata: Metadata = { title: 'Requests' }

export default function RequestPage() {
  return <RequestClient />
}
