'use client'

import { useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listMeetingsInRange } from '@/features/meetings/repositories/meeting.repository'
import { adaptMeetingsToEvents } from '@/features/meetings/adapters/meeting-to-event.adapter'
import type { Meeting } from '@/features/meetings/types'
import { computeCalendarRange } from '../lib/range'
import { buildHourRows, toISODate } from '../lib/time'
import type { CalendarMiniMonth, CalendarTaskItem, CalendarViewModel, CalendarViewTab } from '../types'

const DEFAULT_HOUR_START = 7
const DEFAULT_HOUR_END = 19

// A meeting outside the default 7am–7pm business window (real demo data has
// one starting at 22:00) must still land inside the grid instead of
// overflowing it — widen the rendered hour range to cover whatever actually
// fetched, clamped to a full day, rather than clip real data to a fixed band.
function computeHourBounds(events: { startMinutes: number; endMinutes: number }[]): { start: number; end: number } {
  let startHour = DEFAULT_HOUR_START
  let endHour = DEFAULT_HOUR_END
  for (const e of events) {
    startHour = Math.min(startHour, Math.floor(e.startMinutes / 60))
    endHour = Math.max(endHour, Math.ceil(e.endMinutes / 60))
  }
  return { start: Math.max(0, startHour), end: Math.min(23, endHour) }
}

export interface UseCalendarDataResult {
  viewModel: CalendarViewModel
  /** Raw fetched Meeting records for the current range — CalendarClient uses this to look up a full record for editing (CalendarEvent alone doesn't carry every editable field, e.g. description). Never passed further down into components/. */
  meetings: Meeting[]
  /** True only for the very first fetch of a given range — drives the skeleton. Background range-change refetches keep prior data visible instead (no layout jump). */
  isInitialLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
}

export function useCalendarData(
  anchorDate: Date,
  viewTab: CalendarViewTab,
  todayDate: Date,
  miniMonth: CalendarMiniMonth,
  tasks: CalendarTaskItem[],
): UseCalendarDataResult {
  const range = useMemo(() => computeCalendarRange(anchorDate, viewTab, todayDate), [anchorDate, viewTab, todayDate])
  const rangeKey = `${range.rangeStart.getTime()}_${range.rangeEnd.getTime()}`

  const { data, isFetching, isLoading, isError, refetch } = useQuery({
    queryKey: ['meetings', rangeKey],
    queryFn: () => listMeetingsInRange(range.rangeStart, range.rangeEnd),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const events = useMemo(() => (data ? adaptMeetingsToEvents(data) : []), [data])
  const hours = useMemo(() => {
    const { start, end } = computeHourBounds(events)
    return buildHourRows(start, end)
  }, [events])

  const viewModel: CalendarViewModel = {
    currentDate: toISODate(anchorDate),
    visibleRangeLabel: range.visibleRangeLabel,
    days: range.days,
    hours,
    events,
    tasks,
    miniMonth,
    loading: isLoading,
    empty: !isLoading && !isError && events.length === 0,
  }

  return {
    viewModel,
    meetings: data ?? [],
    isInitialLoading: isLoading && data === undefined,
    isFetching,
    isError,
    refetch: () => { void refetch() },
  }
}
