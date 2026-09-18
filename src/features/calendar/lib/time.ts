import type { CalendarDayColumn, CalendarHourRow } from '../types'

// ── Time-grid geometry ──────────────────────────────────────────────────────
// One row height shared by CalendarWeekHeader's gutter, CalendarTimeGrid's hour
// rows, and CalendarEventLayer's absolute positioning math — change it here
// only, never as a hardcoded px value at a call site.
export const ROW_HEIGHT_PX = 64
export const TIME_GUTTER_PX = 56

export function hm(hour: number, minute = 0): number {
  return hour * 60 + minute
}

export function formatHourLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60)
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12} ${period}`
}

function formatShortTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

export function formatTimeRange(startMinutes: number, endMinutes: number): string {
  return `${formatShortTime(startMinutes)} - ${formatShortTime(endMinutes)}`
}

export function buildHourRows(startHour: number, endHour: number): CalendarHourRow[] {
  const rows: CalendarHourRow[] = []
  for (let h = startHour; h <= endHour; h++) {
    const minutes = hm(h)
    rows.push({ minutes, label: formatHourLabel(minutes) })
  }
  return rows
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const WEEKDAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

/** Builds the Mon…Sun week column set containing `anchor`. */
export function buildWeekDays(anchor: Date, today: Date): CalendarDayColumn[] {
  const monday = new Date(anchor)
  const dow = (monday.getDay() + 6) % 7 // Mon=0 … Sun=6
  monday.setDate(monday.getDate() - dow)
  const todayISO = toISODate(today)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      date: toISODate(d),
      weekdayLabel: WEEKDAY_FMT.format(d),
      dayNumber: d.getDate(),
      isToday: toISODate(d) === todayISO,
    }
  })
}

export function formatRangeLabel(days: CalendarDayColumn[]): string {
  if (days.length === 0) return ''
  const first = days[0]
  const last = days[days.length - 1]
  const [fy, fm, fd] = first.date.split('-').map(Number)
  const [, , ld] = last.date.split('-').map(Number)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(fy, fm - 1, fd))
  return `${monthLabel} ${fd} – ${ld}, ${fy}`
}

export interface EventGeometry {
  top: number
  height: number
}

export function computeEventGeometry(
  event: { startMinutes: number; endMinutes: number },
  gridStartMinutes: number,
  rowHeightPx = ROW_HEIGHT_PX,
): EventGeometry {
  const pxPerMinute = rowHeightPx / 60
  const top = (event.startMinutes - gridStartMinutes) * pxPerMinute
  const height = Math.max((event.endMinutes - event.startMinutes) * pxPerMinute, 30)
  return { top, height }
}

export interface EventLayoutSlot {
  col: number
  totalCols: number
}

/**
 * Assigns each event in a single day column a {col, totalCols} slot so
 * overlapping events sit side by side instead of stacking directly on top of
 * one another (which made every event but the last-rendered one an invisible,
 * unreachable click target — a real defect once real Meeting data can
 * legitimately schedule two things at once, not a hypothetical).
 *
 * Standard interval-graph column-packing: sort by start time, greedily place
 * each event in the first column whose previous occupant has already ended,
 * opening a new column otherwise; every event in one connected overlap
 * cluster shares that cluster's peak concurrency as `totalCols`, so they end
 * up evenly divided rather than each guessing a global column count.
 */
export function layoutOverlappingEvents<T extends { id: string; startMinutes: number; endMinutes: number }>(
  events: T[],
): Map<string, EventLayoutSlot> {
  const slots = new Map<string, EventLayoutSlot>()
  const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)

  let cluster: T[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (cluster.length === 0) return
    const columnEnds: number[] = []
    const colBysId = new Map<string, number>()
    for (const ev of cluster) {
      let col = columnEnds.findIndex((end) => end <= ev.startMinutes)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(ev.endMinutes)
      } else {
        columnEnds[col] = ev.endMinutes
      }
      colBysId.set(ev.id, col)
    }
    const totalCols = columnEnds.length
    for (const ev of cluster) slots.set(ev.id, { col: colBysId.get(ev.id)!, totalCols })
    cluster = []
  }

  for (const ev of sorted) {
    if (cluster.length > 0 && ev.startMinutes >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.endMinutes)
  }
  flush()

  return slots
}
