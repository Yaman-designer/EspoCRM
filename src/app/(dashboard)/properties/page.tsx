import type { Metadata } from 'next'
import { PropertiesClient } from './PropertiesClient'

export const metadata: Metadata = { title: 'Properties' }

export default function PropertiesPageRoute() {
  return <PropertiesClient />
}
