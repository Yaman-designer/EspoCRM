import type { TFunction } from 'i18next'
import type { RealEstateProperty, PropertyCallRef, PropertyMeetingRef, PropertyTaskRef } from '../types/property.types'
import { fmtDate, fmtPrice } from '../lib/display'
import { formatRelativeTime, toEpochMs } from '@/shared/detail-view'

export type TimelineEventKind = 'agent' | 'system' | 'call' | 'meeting' | 'task'

export interface TimelineEventMeta {
  label: string
  value: string
}

export interface TimelineEventViewModel {
  id: string
  type: TimelineEventKind
  // Data-only discriminant distinguishing the two 'system' events (gallery
  // publish vs. registry creation) that would otherwise be visually
  // identical — icon/color RESOLUTION for it lives in PropertyTimeline.tsx,
  // not here. Enterprise architecture pass (2026-07-23): this ViewModel
  // used to import lucide-react icon components directly and carry a
  // resolved `icon`/`iconBgClass`/`roleClass` per event — presentation
  // knowledge that doesn't belong in a data layer a future non-React
  // consumer (or a different icon library) couldn't reuse.
  iconKey?: 'gallery'
  title: string
  role: string
  time: string
  timestamp: number
  content: string
  meta?: TimelineEventMeta
}

export interface TimelineViewModel {
  events: TimelineEventViewModel[]
  hasRealActivity: boolean
}

// Enterprise Localization pass (2026-07-24). `title`/`role`/`content` here
// used to be static English sentences with a name/status/count spliced in
// (e.g. "{name} is managing this listing as the primary agent.") — a
// composed string that can't be split back into "the translatable part" and
// "the real API data" after the fact. Fixed at the source: this function
// now takes `t` (from the calling component's own `useTranslation()`) as a
// parameter and resolves every static fragment through it directly, while
// every genuinely dynamic value (assignedUserName, call/meeting/task
// `name`/`status`/`direction`, counts, dates) still flows straight from the
// API, untouched. A type-only import of `TFunction` from i18next — not
// `react` or `react-i18next` React APIs — so this file stays consistent
// with the view-models/** boundary (no component, no hook, no JSX; just a
// plain function reference passed in like any other dependency). Reactive
// by construction: PropertyDetailView.tsx calls this fresh on every render
// with its own current `t`, so a live language switch re-runs it exactly
// like every other translated string on the page — no separate reactivity
// mechanism needed.

function buildLifecycleEvents(property: RealEstateProperty, t: TFunction): TimelineEventViewModel[] {
  const {
    createdAt, modifiedAt, status, type, requestType,
    imagesIds, assignedUserName, propertyCode, price,
    locationName, regionLocationName,
  } = property

  const locationLabel = locationName?.trim() || regionLocationName?.trim() || null
  const events: TimelineEventViewModel[] = []

  if (assignedUserName) {
    events.push({
      id:        'agent-assigned',
      type:      'agent',
      title:     assignedUserName,
      role:      t('properties:timeline.roles.listingAgent'),
      time:      formatRelativeTime(modifiedAt || createdAt),
      timestamp: toEpochMs(modifiedAt || createdAt),
      content:   t('properties:timeline.content.agentManaging', { name: assignedUserName })
        + (status ? t('properties:timeline.content.currentStatus', { status }) : ''),
      // Status is deliberately not repeated here as a meta stat — the
      // sentence above already states it; Asking Price is the one fact
      // this event can add that isn't shown anywhere else in the timeline.
      meta:      price != null ? { label: t('properties:timeline.meta.askingPrice'), value: fmtPrice(price, false) } : undefined,
    })
  }

  if (imagesIds && imagesIds.length > 0) {
    const photoCount = t('properties:timeline.meta.photo', { count: imagesIds.length })
    events.push({
      id:        'gallery-published',
      type:      'system',
      iconKey:   'gallery',
      title:     t('properties:timeline.titles.listingMedia'),
      role:      t('properties:timeline.roles.mediaPublished'),
      time:      formatRelativeTime(modifiedAt || createdAt),
      timestamp: toEpochMs(modifiedAt || createdAt),
      content:   t('properties:timeline.content.galleryAttached', { photos: photoCount }),
      meta:      { label: t('properties:timeline.meta.photoCount'), value: photoCount },
    })
  }

  const createdBody = [
    t('properties:timeline.content.registryCreated'),
    type,
    locationLabel,
    requestType && `${t('properties:common.for')} ${requestType}`,
  ].filter(Boolean).join(' · ')

  events.push({
    id:        'listing-created',
    type:      'system',
    title:     t('properties:timeline.titles.propertyRegistry'),
    role:      t('properties:timeline.roles.listingCreated'),
    time:      formatRelativeTime(createdAt),
    timestamp: toEpochMs(createdAt),
    content:   createdBody,
    meta:      propertyCode ? { label: t('properties:timeline.meta.propertyCode'), value: `#${propertyCode}` } : undefined,
  })

  return events
}

// ── Build real activity events ─────────────────────────────────────────────────
// call/meeting/task `name`/`status`/`direction` are real API data, never
// translated — only the static "Call"/"Meeting"/"Task" role labels and the
// "Due" prefix are.

function buildActivityEvents(
  calls: PropertyCallRef[], meetings: PropertyMeetingRef[], tasks: PropertyTaskRef[], t: TFunction,
): TimelineEventViewModel[] {
  const callEvents: TimelineEventViewModel[] = calls.map(c => ({
    id: `call-${c.id}`, type: 'call', title: c.name, role: t('properties:timeline.roles.call'),
    time: formatRelativeTime(c.dateStart), timestamp: toEpochMs(c.dateStart),
    content: `${c.status}${c.direction ? ` · ${c.direction}` : ''}`,
  }))
  const meetingEvents: TimelineEventViewModel[] = meetings.map(m => ({
    id: `meeting-${m.id}`, type: 'meeting', title: m.name, role: t('properties:timeline.roles.meeting'),
    time: formatRelativeTime(m.dateStart), timestamp: toEpochMs(m.dateStart),
    content: m.status,
  }))
  const taskEvents: TimelineEventViewModel[] = tasks.map(tk => ({
    id: `task-${tk.id}`, type: 'task', title: tk.name, role: t('properties:timeline.roles.task'),
    time: tk.dateEnd ? t('properties:timeline.content.dueDate', { date: fmtDate(tk.dateEnd) }) : '',
    timestamp: toEpochMs(tk.dateEnd),
    content: tk.status,
  }))
  return [...callEvents, ...meetingEvents, ...taskEvents]
}

/**
 * Merges synthesized lifecycle events (agent assignment, gallery, creation)
 * with real activity records (calls/meetings/tasks) into one chronological,
 * most-recent-first feed. Data only — PropertyTimeline resolves icons and
 * colors per `type`/`iconKey` at render time.
 */
export function buildTimelineViewModel(
  property: RealEstateProperty,
  calls: PropertyCallRef[],
  meetings: PropertyMeetingRef[],
  tasks: PropertyTaskRef[],
  t: TFunction,
): TimelineViewModel {
  const events = [...buildLifecycleEvents(property, t), ...buildActivityEvents(calls, meetings, tasks, t)]
    .sort((a, b) => b.timestamp - a.timestamp)

  return {
    events,
    hasRealActivity: calls.length > 0 || meetings.length > 0 || tasks.length > 0,
  }
}
