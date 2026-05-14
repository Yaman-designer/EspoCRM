import type { Metadata } from 'next'
import { Calendar } from 'lucide-react'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Schedule viewings, meetings, and important dates on a shared team calendar.
      </p>
    </div>
  )
}
