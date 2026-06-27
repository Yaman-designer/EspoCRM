import type { Metadata } from 'next'
import { PropertyFormPage } from './PropertyFormPage'

export const metadata: Metadata = { title: 'New Property' }

export default function NewPropertyRoute() {
  return <PropertyFormPage />
}
