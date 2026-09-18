import { CalendarX } from 'lucide-react'
import { CalendarEventCard } from './CalendarEventCard'
import type { CalendarEvent } from '../../types'

interface CalendarAgendaListProps {
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (id: string | null) => void
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (event: CalendarEvent) => void
  canEdit?: boolean
  canDelete?: boolean
}

// Mobile Day view — Part 4's replacement for a 7-column grid squeezed into a
// phone width. Vertically stacked, full-width, real touch-target-sized cards;
// time is always visible as its own leading column rather than compressed
// into the card body. Same CalendarEvent data and same CalendarEventCard
// component as the desktop grid (variant="agenda"), so event styling and the
// edit/delete/details flow are shared, not reimplemented.
export function CalendarAgendaList({
  events, selectedEventId, onSelectEvent, onEditEvent, onDeleteEvent, canEdit, canDelete,
}: CalendarAgendaListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
        <CalendarX className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-[13px] font-medium text-muted-foreground">Nothing scheduled for this day</p>
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes)

  return (
    <div className="flex flex-col gap-2 p-3">
      {sorted.map((event) => (
        <CalendarEventCard
          key={event.id}
          event={event}
          gridStartMinutes={0}
          variant="agenda"
          isSelected={selectedEventId === event.id}
          onSelect={onSelectEvent}
          onEdit={onEditEvent ? () => onEditEvent(event) : undefined}
          onDelete={onDeleteEvent ? () => onDeleteEvent(event) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  )
}
