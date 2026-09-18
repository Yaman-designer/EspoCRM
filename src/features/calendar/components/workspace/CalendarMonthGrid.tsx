import { cn } from '@/lib/utils'
import { EVENT_KIND_STYLE } from './event-style'
import type { MonthCell } from '../../lib/range'
import type { CalendarEvent } from '../../types'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_VISIBLE_PER_CELL = 2

interface CalendarMonthGridProps {
  cells: MonthCell[]
  events: CalendarEvent[]
  onSelectDay: (date: Date) => void
}

export function CalendarMonthGrid({ cells, events, onSelectDay }: CalendarMonthGridProps) {
  const eventsByDay = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const bucket = eventsByDay.get(event.date)
    if (bucket) bucket.push(event)
    else eventsByDay.set(event.date, [event])
  }

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayEvents = eventsByDay.get(cell.date) ?? []
          const overflow = dayEvents.length - MAX_VISIBLE_PER_CELL
          const [y, m, d] = cell.date.split('-').map(Number)

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDay(new Date(y, m - 1, d))}
              className={cn(
                'flex min-h-[64px] flex-col items-stretch gap-1 border-b border-r border-border/40 p-1.5 text-left transition-colors hover:bg-muted/40 sm:min-h-[92px] sm:p-2',
                !cell.isCurrentMonth && 'bg-muted/10',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                  cell.isToday ? 'bg-primary text-primary-foreground' : cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                )}
              >
                {cell.dayNumber}
              </span>

              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, MAX_VISIBLE_PER_CELL).map((event) => (
                  <span
                    key={event.id}
                    className={cn('truncate rounded px-1 py-0.5 text-[9.5px] font-medium', EVENT_KIND_STYLE[event.kind].tint, EVENT_KIND_STYLE[event.kind].text)}
                  >
                    {event.contactName}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="px-1 text-[9.5px] font-medium text-muted-foreground">+{overflow} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
