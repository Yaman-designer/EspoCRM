import { ROW_HEIGHT_PX, TIME_GUTTER_PX } from '../../lib/time'
import { CalendarEventLayer } from './CalendarEventLayer'
import type { CalendarDayColumn, CalendarEvent, CalendarHourRow } from '../../types'

interface CalendarTimeGridProps {
  days: CalendarDayColumn[]
  hours: CalendarHourRow[]
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (id: string | null) => void
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (event: CalendarEvent) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function CalendarTimeGrid({
  days, hours, events, selectedEventId, onSelectEvent,
  onEditEvent, onDeleteEvent, canEdit, canDelete,
}: CalendarTimeGridProps) {
  const gridStartMinutes = hours[0]?.minutes ?? 0
  const gridHeight = hours.length * ROW_HEIGHT_PX
  const eventsByDay = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const bucket = eventsByDay.get(event.date)
    if (bucket) bucket.push(event)
    else eventsByDay.set(event.date, [event])
  }

  return (
    <div className="flex">
      {/* Hour gutter */}
      <div style={{ width: TIME_GUTTER_PX }} className="shrink-0">
        {hours.map((hour) => (
          <div key={hour.minutes} style={{ height: ROW_HEIGHT_PX }} className="flex items-start justify-end pt-0 pr-2">
            <span className="-translate-y-1/2 text-[10.5px] font-medium text-muted-foreground">{hour.label}</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="grid flex-1 divide-x divide-border/50" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => (
          <div key={day.date} className="relative" style={{ height: gridHeight }}>
            {hours.map((hour, i) => (
              <div key={hour.minutes} className="absolute inset-x-0 border-t border-border/40" style={{ top: i * ROW_HEIGHT_PX }} />
            ))}
            <CalendarEventLayer
              events={eventsByDay.get(day.date) ?? []}
              gridStartMinutes={gridStartMinutes}
              selectedEventId={selectedEventId}
              onSelectEvent={onSelectEvent}
              onEditEvent={onEditEvent}
              onDeleteEvent={onDeleteEvent}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
