import type { Metadata } from 'next'
import { CalendarClient } from '@/features/calendar/CalendarClient'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return <CalendarClient />
}
