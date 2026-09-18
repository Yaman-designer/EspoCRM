'use client'

import { useCallback, useMemo, useState } from 'react'
import { shiftAnchor } from '../lib/range'
import type { CalendarMiniMonth, CalendarScheduleTab, CalendarViewTab } from '../types'

// ── Interaction state ───────────────────────────────────────────────────────
//
// Ephemeral, client-only UI state — selection, active tab, date navigation,
// checked-off tasks. Kept separate from the data layer (useCalendarData) so
// neither knows about the other. This hook only owns navigation *state*
// (anchorDate/viewTab + the actions that move them) — it does NOT compute the
// resulting day columns or fetch window itself; CalendarClient does that once
// (via computeCalendarRange) and feeds the result into both useCalendarData
// and CalendarTemplate, so there is exactly one place that turns
// "anchorDate + viewTab" into an actual range.

export function useCalendarInteractionState(miniMonth: CalendarMiniMonth, initialSelectedEventId: string | null = null) {
  const todayDate = useMemo(() => new Date(miniMonth.year, miniMonth.month, miniMonth.today), [miniMonth.year, miniMonth.month, miniMonth.today])

  const [viewTab, setViewTabState] = useState<CalendarViewTab>('week')
  const [anchorDate, setAnchorDate] = useState<Date>(todayDate)
  const [scheduleTab, setScheduleTab] = useState<CalendarScheduleTab>('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialSelectedEventId)
  const [miniMonthCursor, setMiniMonthCursor] = useState({ year: miniMonth.year, month: miniMonth.month })
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => new Set())

  const setViewTab = useCallback((tab: CalendarViewTab) => setViewTabState(tab), [])

  const goToPrevPeriod = useCallback(() => {
    setAnchorDate((d) => shiftAnchor(d, viewTab, -1))
  }, [viewTab])

  const goToNextPeriod = useCallback(() => {
    setAnchorDate((d) => shiftAnchor(d, viewTab, 1))
  }, [viewTab])

  const goToToday = useCallback(() => setAnchorDate(todayDate), [todayDate])

  /** Jumps the main workspace to a specific date without changing the current view tab. */
  const goToDate = useCallback((d: Date) => setAnchorDate(d), [])

  /** Jumps to a date AND switches to Day view — used by the month grid's "drill in" cell click. */
  const goToDayView = useCallback((d: Date) => {
    setAnchorDate(d)
    setViewTabState('day')
  }, [])

  const goToPrevMonth = useCallback(() => {
    setMiniMonthCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
  }, [])

  const goToNextMonth = useCallback(() => {
    setMiniMonthCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return {
    viewTab, setViewTab,
    anchorDate, todayDate, goToDate, goToDayView, goToPrevPeriod, goToNextPeriod, goToToday,
    scheduleTab, setScheduleTab,
    selectedEventId, setSelectedEventId,
    miniMonthCursor, goToPrevMonth, goToNextMonth,
    completedTaskIds, toggleTask,
  }
}

export type CalendarInteractionState = ReturnType<typeof useCalendarInteractionState>
