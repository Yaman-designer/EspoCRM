// ── Calendar feature — presentation-model types ────────────────────────────────
//
// Everything below is the NORMALIZED shape every Calendar UI component reads
// from. It is produced either by the local fixture builder (Phase 1, current)
// or, later, by an adapter that maps raw EspoCRM `/Meeting` (+ Call/Task)
// responses into this same shape. No component in components/ imports an API
// type directly — this file is the only contract they know about.

export type CalendarEventKind =
  | 'visit'
  | 'call'
  | 'followup'
  | 'legal'
  | 'payment'
  | 'contract'
  /** Meeting.status === 'Not Held' — real EspoCRM value, muted/inactive treatment. */
  | 'cancelled'

export interface CalendarEvent {
  id: string
  /** ISO date ('YYYY-MM-DD') — must match a CalendarDayColumn.date. */
  date: string
  /** Minutes since midnight. */
  startMinutes: number
  endMinutes: number
  kind: CalendarEventKind
  contactName: string
  /** Short purpose label shown on the card, e.g. "Payment", "Signing Contract". */
  purpose: string
  /**
   * Related-record context (e.g. a linked Property/Contact's display name),
   * NOT a physical address — real Meeting data has no address field. Shown
   * with a context icon in EventDetails, never labeled "Address".
   */
  location?: string
  phone?: string
  /** Human status label, e.g. "Planned" — present for adapter-produced events. */
  statusLabel?: string
  assignedUserName?: string
}

export interface CalendarDayColumn {
  /** ISO date ('YYYY-MM-DD'). */
  date: string
  weekdayLabel: string
  dayNumber: number
  isToday: boolean
}

export interface CalendarHourRow {
  /** Minutes since midnight, e.g. 480 for 8 AM. */
  minutes: number
  label: string
}

export type CalendarViewTab = 'day' | 'week' | 'month'
export type CalendarScheduleTab = 'all' | 'assigned' | 'mine'

export interface CalendarTaskItem {
  id: string
  title: string
  subtitle: string
  done: boolean
  /** Which ScheduleTabs bucket this task belongs to (beyond 'all'). */
  owner: 'assigned' | 'mine'
}

export interface CalendarMiniMonth {
  year: number
  /** 0-indexed, matches Date#getMonth(). */
  month: number
  today: number
  activeDays: number[]
}

export interface CalendarViewModel {
  /** ISO date the visible range is anchored to. */
  currentDate: string
  /** Human-readable label for the visible range, e.g. "Jun 9 – 15, 2025". */
  visibleRangeLabel: string
  days: CalendarDayColumn[]
  hours: CalendarHourRow[]
  events: CalendarEvent[]
  tasks: CalendarTaskItem[]
  miniMonth: CalendarMiniMonth
  loading: boolean
  empty: boolean
}
