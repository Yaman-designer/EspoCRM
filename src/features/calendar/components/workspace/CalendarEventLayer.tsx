import { useMemo } from 'react'
import { layoutOverlappingEvents } from '../../lib/time'
import { CalendarEventCard } from './CalendarEventCard'
import type { CalendarEvent } from '../../types'

interface CalendarEventLayerProps {
  events: CalendarEvent[]
  gridStartMinutes: number
  selectedEventId: string | null
  onSelectEvent: (id: string | null) => void
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (event: CalendarEvent) => void
  canEdit?: boolean
  canDelete?: boolean
}

// Absolutely-positions a day column's events over CalendarTimeGrid's hour
// lines. Overlapping events are laid out side by side (layoutOverlappingEvents)
// rather than stacked directly on top of each other.
export function CalendarEventLayer({
  events, gridStartMinutes, selectedEventId, onSelectEvent,
  onEditEvent, onDeleteEvent, canEdit, canDelete,
}: CalendarEventLayerProps) {
  const layout = useMemo(() => layoutOverlappingEvents(events), [events])

  return (
    <>
      {events.map((event) => (
        <CalendarEventCard
          key={event.id}
          event={event}
          gridStartMinutes={gridStartMinutes}
          layoutSlot={layout.get(event.id)}
          isSelected={selectedEventId === event.id}
          onSelect={onSelectEvent}
          onEdit={onEditEvent ? () => onEditEvent(event) : undefined}
          onDelete={onDeleteEvent ? () => onDeleteEvent(event) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </>
  )
}
