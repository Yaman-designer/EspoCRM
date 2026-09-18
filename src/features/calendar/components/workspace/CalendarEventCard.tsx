'use client'

import type { CSSProperties } from 'react'
import { Clock } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { computeEventGeometry, formatTimeRange, type EventLayoutSlot } from '../../lib/time'
import { EventDetails } from '../overlays/EventDetails'
import { EVENT_KIND_STYLE } from './event-style'
import type { CalendarEvent } from '../../types'

interface CalendarEventCardProps {
  event: CalendarEvent
  gridStartMinutes: number
  isSelected: boolean
  onSelect: (id: string | null) => void
  /** 'grid' (default): absolute-positioned compact card + Popover, for the desktop/tablet hour grid.
   *  'agenda': flow-layout vertical card + bottom Sheet, for the mobile agenda list — same event data, same actions, different chrome for touch targets and screen width. */
  variant?: 'grid' | 'agenda'
  /** Column assignment when this event overlaps others in the same day (from layoutOverlappingEvents) — undefined/single-column falls back to the plain full-width card. */
  layoutSlot?: EventLayoutSlot
  onEdit?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

export function CalendarEventCard({
  event, gridStartMinutes, isSelected, onSelect,
  variant = 'grid', layoutSlot, onEdit, onDelete, canEdit, canDelete,
}: CalendarEventCardProps) {
  const style = EVENT_KIND_STYLE[event.kind]
  const timeRange = formatTimeRange(event.startMinutes, event.endMinutes)

  if (variant === 'agenda') {
    return (
      <Sheet open={isSelected} onOpenChange={(open) => onSelect(open ? event.id : null)}>
        <button
          type="button"
          onClick={() => onSelect(event.id)}
          className={cn(
            'flex w-full items-start gap-3 rounded-xl border border-border/50 border-l-[3px] bg-card px-3.5 py-3 text-left shadow-design-xs transition-shadow active:shadow-none',
            style.bar, style.tint,
          )}
        >
          <div className="w-16 shrink-0 pt-0.5">
            <span className={cn('text-[12px] font-semibold', style.text)}>{timeRange.split(' - ')[0]}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-foreground">{event.contactName}</p>
            <p className="truncate text-[12px] text-muted-foreground">{event.purpose}</p>
          </div>
        </button>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Event details</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <EventDetails event={event} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const { top, height } = computeEventGeometry(event, gridStartMinutes)
  const { col = 0, totalCols = 1 } = layoutSlot ?? {}
  const overlapping = totalCols > 1
  // Overlapping events split the column N ways with a small gutter between
  // them, instead of every card at full inset-x-1 width stacking on top of
  // each other (the earlier-rendered ones became invisible, unreachable
  // click targets — a real defect once two Meetings can share a slot).
  const positionStyle: CSSProperties = overlapping
    ? { top, height, left: `calc(${col} * (100% / ${totalCols}) + 2px)`, width: `calc(100% / ${totalCols} - 4px)` }
    : { top, height }

  return (
    <Popover open={isSelected} onOpenChange={(open) => onSelect(open ? event.id : null)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={positionStyle}
          className={cn(
            'absolute flex flex-col items-start gap-0.5 overflow-hidden rounded-lg border border-border/50 border-l-[3px] bg-card px-2.5 py-2 text-left shadow-design-xs transition-shadow duration-(--duration-medium) hover:shadow-design-sm',
            !overlapping && 'inset-x-1',
            style.bar,
            style.tint,
            isSelected && 'shadow-design-md ring-1 ring-primary/50 z-10',
          )}
        >
          <span className="line-clamp-1 text-[11px] font-semibold text-foreground">{event.contactName}</span>
          <span className="line-clamp-1 text-[10px] text-muted-foreground">{event.purpose}</span>
          {height > 46 && (
            <span className={cn('mt-auto flex items-center gap-1 text-[9px] font-semibold', style.text)}>
              <Clock className="h-2.5 w-2.5" />
              {timeRange}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-72">
        <EventDetails event={event} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
      </PopoverContent>
    </Popover>
  )
}
