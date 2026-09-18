import { buildWeekDays, toISODate } from './time'
import type { CalendarDayColumn, CalendarViewTab } from '../types'

// ── Navigable range computation ─────────────────────────────────────────────
//
// Pure functions: given an anchor date + view tab, derive both the day
// columns the workspace renders AND the [rangeStart, rangeEnd) window the
// data layer fetches for (useCalendarData windows its Meeting query to
// exactly this range — see that hook). Kept separate from lib/time.ts (which
// stays focused on time-of-day formatting/geometry).

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

const WEEKDAY_LONG_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
const MONTH_LONG_FMT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const MONTH_DAY_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function buildDayColumn(anchor: Date, today: Date): CalendarDayColumn[] {
  return [{
    date: toISODate(anchor),
    weekdayLabel: WEEKDAY_LONG_FMT.format(anchor),
    dayNumber: anchor.getDate(),
    isToday: toISODate(anchor) === toISODate(today),
  }]
}

export interface CalendarRange {
  days: CalendarDayColumn[]
  /** Inclusive start of the fetch/display window. */
  rangeStart: Date
  /** Exclusive end of the fetch/display window. */
  rangeEnd: Date
  visibleRangeLabel: string
}

export function computeCalendarRange(anchor: Date, viewTab: CalendarViewTab, today: Date): CalendarRange {
  if (viewTab === 'day') {
    const rangeStart = startOfDay(anchor)
    return {
      days: buildDayColumn(anchor, today),
      rangeStart,
      rangeEnd: addDays(rangeStart, 1),
      visibleRangeLabel: MONTH_DAY_FMT.format(anchor),
    }
  }

  if (viewTab === 'month') {
    const rangeStart = startOfMonth(anchor)
    return {
      days: [], // Month view renders its own grid (CalendarMonthGrid) — not day columns.
      rangeStart,
      rangeEnd: addMonths(anchor, 1),
      visibleRangeLabel: MONTH_LONG_FMT.format(anchor),
    }
  }

  // week
  const days = buildWeekDays(anchor, today)
  const [fy, fm, fd] = days[0].date.split('-').map(Number)
  const rangeStart = new Date(fy, fm - 1, fd)
  const rangeEnd = addDays(rangeStart, 7)
  const lastDay = days[6].dayNumber
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(rangeStart)
  return {
    days,
    rangeStart,
    rangeEnd,
    visibleRangeLabel: `${monthLabel} ${fd} – ${lastDay}, ${fy}`,
  }
}

// ── Month grid (for CalendarMonthGrid) ──────────────────────────────────────

export interface MonthCell {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * A 7-column week grid has nowhere to go under ~480px (Part 4's mobile
 * requirement) — mobile only ever fetches/renders Day or Month. Shared by
 * useCalendarData (what to fetch) and CalendarWorkspace (what to render) so
 * the two never disagree about which range is actually visible.
 */
export function resolveEffectiveViewTab(viewTab: CalendarViewTab, isMobile: boolean): CalendarViewTab {
  return isMobile && viewTab === 'week' ? 'day' : viewTab
}

/** Moves `anchor` by one period in the given view (±1 day / ±1 week / ±1 month). */
export function shiftAnchor(anchor: Date, viewTab: CalendarViewTab, direction: 1 | -1): Date {
  if (viewTab === 'day') return addDays(anchor, direction)
  if (viewTab === 'month') return addMonths(anchor, direction)
  return addDays(anchor, direction * 7)
}

export function buildMonthCells(anchor: Date, today: Date): MonthCell[] {
  const first = startOfMonth(anchor)
  const firstCol = (first.getDay() + 6) % 7 // Mon=0…Sun=6
  const gridStart = addDays(first, -firstCol)
  const todayISO = toISODate(today)
  const month = anchor.getMonth()

  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(gridStart, i)
    const iso = toISODate(d)
    return {
      date: iso,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: iso === todayISO,
    }
  })
}
