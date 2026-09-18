import { cn } from '@/lib/utils'
import { TIME_GUTTER_PX } from '../../lib/time'
import type { CalendarDayColumn } from '../../types'

interface CalendarWeekHeaderProps {
  days: CalendarDayColumn[]
}

export function CalendarWeekHeader({ days }: CalendarWeekHeaderProps) {
  return (
    <div className="flex border-b border-border/60">
      <div style={{ width: TIME_GUTTER_PX }} className="shrink-0" />
      <div className="grid flex-1 divide-x divide-border/50" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-0.5 px-2 py-2.5">
            <span className={cn('text-[11px] font-medium uppercase tracking-wide', day.isToday ? 'text-primary' : 'text-muted-foreground')}>
              {days.length === 1 ? day.weekdayLabel : day.weekdayLabel.slice(0, 3)}
            </span>
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold',
                day.isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
              )}
            >
              {day.dayNumber}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
