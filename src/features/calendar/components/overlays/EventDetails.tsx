import { Clock, MapPin, Pencil, Phone, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'
import { formatTimeRange } from '../../lib/time'
import type { CalendarEvent } from '../../types'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

// Same status→badge vocabulary callsConfig already uses for Call (a real
// sibling entity with the identical Planned/Held/Not Held enum) — not a new
// mapping invented for Calendar.
const STATUS_BADGE: Record<string, BadgeVariant> = {
  Planned: 'info',
  Held: 'success',
  'Not Held': 'cancelled',
}

interface EventDetailsProps {
  event: CalendarEvent
  onEdit?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

// Content shown for a selected event — reused inside both the desktop
// Popover (CalendarEventCard, variant="grid") and the mobile bottom Sheet
// (variant="agenda"). Never reads API/adapter types directly, only CalendarEvent.
export function EventDetails({ event, onEdit, onDelete, canEdit, canDelete }: EventDetailsProps) {
  const showActions = (canEdit && onEdit) || (canDelete && onDelete)

  return (
    <div className="flex flex-col gap-3 p-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {initials(event.contactName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{event.contactName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{event.purpose}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {event.statusLabel && (
            <Badge variant={STATUS_BADGE[event.statusLabel] ?? 'outline'}>{event.statusLabel}</Badge>
          )}
          {event.phone && (
            <Button variant="secondary" size="icon-xs" aria-label={`Call ${event.contactName}`}>
              <Phone className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {formatTimeRange(event.startMinutes, event.endMinutes)}
      </div>

      {event.location && (
        <div className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{event.location}</span>
        </div>
      )}

      {event.assignedUserName && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span>{event.assignedUserName}</span>
        </div>
      )}

      {showActions && (
        // size="sm" (36px) rather than "xs" (28px) — this row renders inside
        // both the desktop Popover and the mobile Sheet, and the mobile case
        // needs a real touch target, not just a compact mouse target.
        <div className="flex items-center gap-2 border-t border-border/50 pt-2.5">
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {canDelete && onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
