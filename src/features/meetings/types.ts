// ── Meeting — raw EspoCRM entity shape ──────────────────────────────────────
//
// Confirmed live against the running EspoCRM instance (GET /Meeting,
// GET /Meeting/{id}, GET /Metadata?scopes[]=Meeting) — not guessed. Only
// fields this app actually reads are typed; EspoCRM returns more (uid,
// streamUpdatedAt, followersIds, reminders, acceptanceStatus, …) that are
// intentionally omitted here.
//
// Notably absent from stock Meeting: any address/location field, and no
// phone field on the meeting itself (or on the linkMultiple attendee
// payload). The adapter (meeting-to-event.adapter.ts) never invents either.

export type MeetingStatus = 'Planned' | 'Held' | 'Not Held'

export interface Meeting {
  id: string
  name: string
  status: MeetingStatus
  /** EspoCRM datetime string, "YYYY-MM-DD HH:mm:ss" (local, no explicit offset). */
  dateStart: string
  dateEnd: string
  isAllDay: boolean
  description: string | null

  /** linkParent — the record this meeting relates to, when set. */
  parentId: string | null
  parentType: string | null
  parentName: string | null

  assignedUserId: string | null
  assignedUserName: string | null

  usersIds?: string[]
  usersNames?: Record<string, string>
  contactsIds?: string[]
  contactsNames?: Record<string, string>
  leadsIds?: string[]
  leadsNames?: Record<string, string>
}

// ── Create/update payload ────────────────────────────────────────────────────
// dateEnd is required by entityDefs (`"required": true, "after": "dateStart"`).

export interface MeetingWritePayload {
  name: string
  status?: MeetingStatus
  dateStart: string
  dateEnd: string
  assignedUserId?: string
  description?: string
}
