import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CALENDAR } from './data'

// Mon → Sun week order
const WEEKDAYS    = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildGrid(year: number, month: number): (number | null)[] {
  // Convert Sun=0…Sat=6 → Mon=0…Sun=6
  const rawDay     = new Date(year, month, 1).getDay()
  const firstCol   = (rawDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = Array(firstCol).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function CalendarWidget() {
  const { year, month, today, activeDays } = CALENDAR
  const cells = buildGrid(year, month)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-design-sm">

      {/* Navigation header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="h-8" />
          const isToday  = day === today
          const isActive = activeDays.includes(day)
          return (
            <button
              key={day}
              className={cn(
                'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                isToday  && 'bg-primary text-primary-foreground shadow-design-sm',
                !isToday && isActive  && 'bg-primary/10 font-semibold text-primary',
                !isToday && !isActive && 'text-foreground hover:bg-muted',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
