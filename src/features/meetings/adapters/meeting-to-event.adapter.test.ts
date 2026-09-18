import { describe, it, expect } from 'vitest'
import { adaptMeetingToEvent, adaptMeetingsToEvents } from './meeting-to-event.adapter'
import type { Meeting } from '../types'

function buildMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: 'm1',
    name: 'Signing Contract',
    status: 'Planned',
    dateStart: '2026-06-10 09:00:00',
    dateEnd: '2026-06-10 10:00:00',
    isAllDay: false,
    description: null,
    parentId: null,
    parentType: null,
    parentName: null,
    assignedUserId: 'u1',
    assignedUserName: 'Developer Test',
    ...overrides,
  }
}

describe('adaptMeetingToEvent — Phase 4 edge-case audit', () => {
  it('returns null (not a throw) for a null dateStart instead of crashing the whole list', () => {
    // @ts-expect-error deliberately simulating a malformed API record
    const meeting = buildMeeting({ dateStart: null })
    expect(adaptMeetingToEvent(meeting)).toBeNull()
  })

  it('returns null for an unparseable dateEnd', () => {
    const meeting = buildMeeting({ dateEnd: 'not-a-date' })
    expect(adaptMeetingToEvent(meeting)).toBeNull()
  })

  it('adaptMeetingsToEvents filters out malformed records instead of throwing, keeping the valid ones', () => {
    const good = buildMeeting({ id: 'good' })
    const bad = buildMeeting({ id: 'bad', dateStart: undefined })
    const events = adaptMeetingsToEvents([good, bad])
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('good')
  })

  it('falls back to "Untitled meeting" for an empty name with no attendees, and does not duplicate it as the purpose', () => {
    const meeting = buildMeeting({ name: '', contactsNames: {}, leadsNames: {}, usersNames: {} })
    const event = adaptMeetingToEvent(meeting)
    expect(event?.contactName).toBe('Untitled meeting')
    expect(event?.purpose).toBe('Planned') // status, not a repeated blank name
  })

  it('uses the first Contact attendee as contactName and the meeting name as purpose when an attendee exists', () => {
    const meeting = buildMeeting({ contactsNames: { c1: 'Sarah Thompson' } })
    const event = adaptMeetingToEvent(meeting)
    expect(event?.contactName).toBe('Sarah Thompson')
    expect(event?.purpose).toBe('Signing Contract')
  })

  it('omits location/phone/assignedUserName when not present, never renders as literal "undefined"', () => {
    const meeting = buildMeeting({ parentName: null, assignedUserName: null })
    const event = adaptMeetingToEvent(meeting)
    expect(event?.location).toBeUndefined()
    expect(event?.phone).toBeUndefined()
    expect(event?.assignedUserName).toBeUndefined()
  })

  it('clamps a meeting that crosses midnight to end of the start day (23:59), not a negative or wrapped duration', () => {
    const meeting = buildMeeting({ dateStart: '2026-06-10 23:00:00', dateEnd: '2026-06-11 01:00:00' })
    const event = adaptMeetingToEvent(meeting)
    expect(event?.date).toBe('2026-06-10')
    expect(event?.startMinutes).toBe(23 * 60)
    expect(event?.endMinutes).toBe(24 * 60 - 1)
  })

  it('an all-day meeting spans the full visible day (0 to 23:59)', () => {
    const meeting = buildMeeting({ isAllDay: true, dateStart: '2026-06-10 00:00:00', dateEnd: '2026-06-10 23:59:00' })
    const event = adaptMeetingToEvent(meeting)
    expect(event?.startMinutes).toBe(0)
    expect(event?.endMinutes).toBe(24 * 60 - 1)
  })

  it('guarantees a positive-duration event (min 30 min) when dateEnd <= dateStart in the raw data', () => {
    const meeting = buildMeeting({ dateStart: '2026-06-10 10:00:00', dateEnd: '2026-06-10 09:00:00' })
    const event = adaptMeetingToEvent(meeting)
    expect(event!.endMinutes).toBeGreaterThan(event!.startMinutes)
  })

  it('maps status → kind using EspoCRM\'s own status/style convention (Held=success→call, Not Held=info→cancelled, Planned=default→visit)', () => {
    expect(adaptMeetingToEvent(buildMeeting({ status: 'Held' }))?.kind).toBe('call')
    expect(adaptMeetingToEvent(buildMeeting({ status: 'Not Held' }))?.kind).toBe('cancelled')
    expect(adaptMeetingToEvent(buildMeeting({ status: 'Planned' }))?.kind).toBe('visit')
  })
})
