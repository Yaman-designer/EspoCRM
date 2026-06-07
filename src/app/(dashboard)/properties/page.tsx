import type { Metadata } from 'next'
import { PropertiesPage } from '@/features/properties/pages/PropertiesPage'

export const metadata: Metadata = { title: 'Properties' }

export default function Page() {
  return <PropertiesPage />
}
