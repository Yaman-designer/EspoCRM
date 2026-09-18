import { Skeleton } from '@/components/ui/skeleton'
import { ROW_HEIGHT_PX, TIME_GUTTER_PX } from '../../lib/time'

const SKELETON_ROWS = 8
const SKELETON_COLS = 5

// Mirrors CalendarToolbar + CalendarWeekHeader + CalendarTimeGrid's real
// geometry (same row height / gutter width constants) so the real content
// swaps in at the same size — no layout shift once data arrives. Only shown
// on the very first fetch of a range (see useCalendarData's isInitialLoading)
// — subsequent day/week/month navigation keeps the previous grid visible via
// React Query's keepPreviousData instead of re-showing this.
export function CalendarSkeleton() {
  return (
    <div aria-hidden="true" aria-busy="true" className="animate-pulse">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-3 sm:px-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="flex border-b border-border/60">
        <div style={{ width: TIME_GUTTER_PX }} className="shrink-0" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${SKELETON_COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: SKELETON_COLS }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 px-2 py-2.5">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        <div style={{ width: TIME_GUTTER_PX }} className="shrink-0">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <div key={i} style={{ height: ROW_HEIGHT_PX }} className="flex items-start justify-end pr-2 pt-1">
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
        <div className="grid flex-1 divide-x divide-border/50" style={{ gridTemplateColumns: `repeat(${SKELETON_COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: SKELETON_COLS }).map((_, col) => (
            <div key={col} className="relative" style={{ height: SKELETON_ROWS * ROW_HEIGHT_PX }}>
              {Array.from({ length: SKELETON_ROWS }).map((_, row) => (
                <div key={row} className="absolute inset-x-0 border-t border-border/40" style={{ top: row * ROW_HEIGHT_PX }} />
              ))}
              {/* A couple of representative event-card placeholders, positioned like real cards. */}
              {(col + 1) % 2 === 0 && (
                <Skeleton className="absolute inset-x-1 rounded-lg" style={{ top: ROW_HEIGHT_PX * 1.2, height: ROW_HEIGHT_PX * 1.4 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
