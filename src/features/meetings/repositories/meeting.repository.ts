import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type { Meeting } from '../types'

export const MEETING_ENDPOINT = '/Meeting'

/** EspoCRM datetime string — "YYYY-MM-DD HH:mm:ss", local wall-clock, no offset (matches lib/date.ts's parse convention). */
export function toEspoDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/**
 * Fetches meetings whose `dateStart` falls within [from, to). Windowed by the
 * calendar's own visible range — see useCalendarData — rather than fetching
 * every meeting the user can see, which would grow unbounded over time.
 *
 * Known limitation: a meeting that starts before `from` but runs into the
 * range (an overnight/multi-day meeting) is not returned — filtering on
 * dateStart only, not an OR against dateEnd, keeps the EspoCRM `where` query
 * simple. Acceptable for a first production pass; see Phase 2 report.
 */
export async function listMeetingsInRange(from: Date, to: Date): Promise<Meeting[]> {
  const { data } = await axiosClient.get<EspoListResponse<Meeting>>(MEETING_ENDPOINT, {
    params: {
      maxSize: 200,
      offset: 0,
      orderBy: 'dateStart',
      order: 'asc',
      select: [
        'id', 'name', 'status', 'dateStart', 'dateEnd', 'isAllDay', 'description',
        'parentId', 'parentType', 'parentName',
        'assignedUserId', 'assignedUserName',
        'usersIds', 'usersNames', 'contactsIds', 'contactsNames', 'leadsIds', 'leadsNames',
      ].join(','),
      'where[0][type]': 'greaterThanOrEquals',
      'where[0][attribute]': 'dateStart',
      'where[0][value]': toEspoDateTime(from),
      'where[1][type]': 'lessThan',
      'where[1][attribute]': 'dateStart',
      'where[1][value]': toEspoDateTime(to),
    },
  })
  return data.list
}

export async function deleteMeeting(id: string): Promise<void> {
  await axiosClient.delete(`${MEETING_ENDPOINT}/${id}`)
}
