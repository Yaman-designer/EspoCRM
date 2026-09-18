// ── Calendar — deterministic fixture ────────────────────────────────────────
//
// Phase 2 status: CalendarClient.tsx now sources real `events` from
// useCalendarData (Meeting → CalendarEvent, see features/meetings). This
// module is no longer the live events source, but stays wired for two things
// CalendarClient still uses directly: TASKS (the sidebar checklist — no Task
// entity integration exists yet, out of Phase 2's Meeting-only scope) and
// MINI_MONTH (the mini-calendar's today/active-day markers). `buildCalendarFixture()`
// itself is kept as a complete standalone fixture for tests/local preview.
//
// `today`/`activeDays` reuse the existing dashboard-overview mock (`CALENDAR`
// in components/dashboard/overview/data.ts) so the mini-calendar here and the
// one on the dashboard read the same "current" date instead of drifting.

import { CALENDAR } from '@/components/dashboard/overview/data'
import { buildHourRows, buildWeekDays, formatRangeLabel, hm, toISODate } from '../lib/time'
import type { CalendarEvent, CalendarTaskItem, CalendarViewModel } from '../types'

const TODAY = new Date(CALENDAR.year, CALENDAR.month, CALENDAR.today)

function buildEvents(days: ReturnType<typeof buildWeekDays>): CalendarEvent[] {
  const [mon, tue, wed, thu, fri, sat, sun] = days.map((d) => d.date)
  void wed

  return [
    { id: 'evt-1', date: mon, startMinutes: hm(11, 30), endMinutes: hm(13, 0), kind: 'visit', contactName: 'Sarah Thompson', purpose: 'Payment' },
    { id: 'evt-2', date: tue, startMinutes: hm(8, 0), endMinutes: hm(8, 45), kind: 'visit', contactName: 'Alexandra Chia', purpose: 'Viewing Property' },
    {
      id: 'evt-3', date: tue, startMinutes: hm(9, 0), endMinutes: hm(11, 0), kind: 'contract',
      contactName: 'Kristian Wu', purpose: 'Signing Contract',
      location: '742 Oak Street, Denver, CO 80220', phone: '+1 (512) 555-0398',
    },
    { id: 'evt-4', date: tue, startMinutes: hm(13, 30), endMinutes: hm(14, 0), kind: 'followup', contactName: 'Sarah Thompson', purpose: 'Follow Up' },
    { id: 'evt-5', date: thu, startMinutes: hm(10, 0), endMinutes: hm(11, 30), kind: 'legal', contactName: 'Sarah Thompson', purpose: 'Legal Review' },
    { id: 'evt-6', date: fri, startMinutes: hm(8, 0), endMinutes: hm(9, 0), kind: 'call', contactName: 'Sarah Thompson', purpose: 'Payment' },
    { id: 'evt-7', date: fri, startMinutes: hm(11, 30), endMinutes: hm(13, 0), kind: 'visit', contactName: 'Sarah Thompson', purpose: 'Payment' },
    { id: 'evt-8', date: sat, startMinutes: hm(10, 0), endMinutes: hm(11, 30), kind: 'call', contactName: 'Noah Bennett', purpose: 'Viewing Property' },
    { id: 'evt-9', date: sun, startMinutes: hm(10, 0), endMinutes: hm(11, 30), kind: 'visit', contactName: 'Sarah Thompson', purpose: 'Payment' },
  ]
}

export const TASKS: CalendarTaskItem[] = [
  { id: 'task-1', title: 'Visit Client Michael Reynolds', subtitle: '742 Oak Street, Denver, CO 80220', done: true, owner: 'mine' },
  { id: 'task-2', title: 'Visit Client Sarah Thompson', subtitle: '1256 Maple Ave, Austin, TX 78704', done: false, owner: 'assigned' },
  { id: 'task-3', title: 'Follow Up Aaliyah Lovato', subtitle: 'aaliyah@livento.com · (512) 555-0398', done: false, owner: 'mine' },
]

export const MINI_MONTH = {
  year: CALENDAR.year,
  month: CALENDAR.month,
  today: CALENDAR.today,
  activeDays: CALENDAR.activeDays,
}

export const DEFAULT_SELECTED_EVENT_ID = 'evt-3'

export function buildCalendarFixture(): CalendarViewModel {
  const days = buildWeekDays(TODAY, TODAY)
  const hours = buildHourRows(8, 18)

  return {
    currentDate: toISODate(TODAY),
    visibleRangeLabel: formatRangeLabel(days),
    days,
    hours,
    events: buildEvents(days),
    tasks: TASKS,
    miniMonth: MINI_MONTH,
    loading: false,
    empty: false,
  }
}
