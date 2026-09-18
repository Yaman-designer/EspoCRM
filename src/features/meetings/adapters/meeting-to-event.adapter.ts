import { toISODate } from '@/features/calendar/lib/time'
import type { CalendarEvent, CalendarEventKind } from '@/features/calendar/types'
import type { Meeting } from '../types'

// ── Meeting → CalendarEvent ─────────────────────────────────────────────────
//
// The ONLY place a raw EspoCRM Meeting shape is read. Every field below maps
// from a field confirmed live on the real entity (see types.ts's header) —
// nothing here is invented. Where real data doesn't cleanly separate "who"
// from "why" (Meeting has one `name`/subject, not a contact + purpose pair),
// the mapping is documented rather than silently fabricated.

const MINUTES_PER_DAY = 24 * 60
const LAST_MINUTE_OF_DAY = MINUTES_PER_DAY - 1
const UNTITLED = 'Untitled meeting'

/**
 * Same convention as lib/date.ts's formatDate/formatDatetime: treat the
 * "YYYY-MM-DD HH:mm:ss" string as local wall-clock time, no TZ conversion.
 * Returns null for missing/malformed input instead of throwing or producing
 * an Invalid Date — dateStart/dateEnd are `required: true` in EspoCRM's own
 * entityDefs, but that's a server-side constraint, not a runtime guarantee
 * this adapter can trust for every possible record (legacy/imported rows).
 */
function parseEspoDateTime(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Best-effort visual categorization from Meeting.status, mirroring EspoCRM's
 * own status→style hint (entityDefs.Meeting.fields.status.style — live-
 * confirmed: Held→"success", "Not Held"→"info", Planned→null/default) rather
 * than a fabricated taxonomy layered onto data that doesn't carry one.
 */
function deriveKind(meeting: Meeting): CalendarEventKind {
  if (meeting.status === 'Held') return 'call'
  if (meeting.status === 'Not Held') return 'cancelled'
  return 'visit'
}

/**
 * First real attendee — Contacts, then Leads, then invited Users (excluding
 * the assignee) — else the meeting's own subject. `fromSubject` tells
 * derivePurpose whether `name` landed here as a fallback (so it isn't
 * repeated as the purpose line too) or came from a genuine attendee.
 */
function derivePrimaryName(meeting: Meeting): { name: string; fromSubject: boolean } {
  const contactNames = Object.values(meeting.contactsNames ?? {})
  if (contactNames[0]) return { name: contactNames[0], fromSubject: false }

  const leadNames = Object.values(meeting.leadsNames ?? {})
  if (leadNames[0]) return { name: leadNames[0], fromSubject: false }

  const userNames = Object.entries(meeting.usersNames ?? {})
    .filter(([id]) => id !== meeting.assignedUserId)
    .map(([, name]) => name)
  if (userNames[0]) return { name: userNames[0], fromSubject: false }

  // `name` is required server-side, but that's not a runtime guarantee this
  // adapter can trust for every record — an empty string would otherwise
  // render as a blank bold line instead of a readable label.
  return { name: meeting.name || UNTITLED, fromSubject: true }
}

/** Avoids the two card lines reading as a literal duplicate when there's no attendee to show separately from the subject. */
function derivePurpose(meeting: Meeting, fromSubject: boolean): string {
  return fromSubject ? meeting.status : (meeting.name || meeting.status)
}

/**
 * Real Meeting has no address/location field — this surfaces the linked
 * record's display name (parentName) as context only, e.g. "742 Oak Street
 * Listing" if parentType is RealEstateProperty. Never presented as a
 * physical address.
 */
function deriveLocation(meeting: Meeting): string | undefined {
  return meeting.parentName ?? undefined
}

/**
 * Returns null (rather than throwing) for a record with an unparseable
 * dateStart/dateEnd — a single malformed row must not take down the whole
 * calendar render. adaptMeetingsToEvents filters these out.
 */
export function adaptMeetingToEvent(meeting: Meeting): CalendarEvent | null {
  const start = parseEspoDateTime(meeting.dateStart)
  const end = parseEspoDateTime(meeting.dateEnd)
  if (!start || !end) return null

  const date = toISODate(start)

  // Real data can be messy (isAllDay flags that don't match the actual
  // dateStart/dateEnd span, multi-day meetings) — clamp everything to the
  // single visible day this event is bucketed under rather than let it
  // overflow the time grid or produce a negative/zero-height card.
  const startMinutes = meeting.isAllDay ? 0 : minutesOfDay(start)
  const endsSameDay = toISODate(end) === date
  let endMinutes = meeting.isAllDay || !endsSameDay ? LAST_MINUTE_OF_DAY : minutesOfDay(end)
  if (endMinutes <= startMinutes) endMinutes = Math.min(startMinutes + 30, LAST_MINUTE_OF_DAY)

  const { name: primaryName, fromSubject } = derivePrimaryName(meeting)

  return {
    id: meeting.id,
    date,
    startMinutes,
    endMinutes,
    kind: deriveKind(meeting),
    contactName: primaryName,
    purpose: derivePurpose(meeting, fromSubject),
    location: deriveLocation(meeting),
    statusLabel: meeting.status,
    assignedUserName: meeting.assignedUserName ?? undefined,
  }
}

export function adaptMeetingsToEvents(meetings: Meeting[]): CalendarEvent[] {
  return meetings
    .map(adaptMeetingToEvent)
    .filter((event): event is CalendarEvent => event !== null)
}
