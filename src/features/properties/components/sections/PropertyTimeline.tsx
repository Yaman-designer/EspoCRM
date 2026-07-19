'use client'

import { useState } from 'react'
import { MessageSquare, Activity, Phone, CalendarClock, ListChecks, ChevronDown } from 'lucide-react'
import { fmtDate, fmtPrice } from '../../lib/display'
import type { RealEstateProperty, PropertyCallRef, PropertyMeetingRef, PropertyTaskRef } from '../../types/property.types'

// IA Sprint 3 (2026-07-18). Merged from PropertyIntelligenceStream (a
// synthesized lifecycle narrative — agent assignment, gallery, creation)
// and PropertyActivityPanel (real calls/meetings/tasks) — both answered
// "what happened on this listing," in two visually unrelated patterns with
// no shared chronological order. One timeline now, sorted most-recent
// first; synthesized entries keep the "System"/"Agent" role labels they
// always had, real activity gets its own type per record so neither reads
// as the other.

// ── Types ──────────────────────────────────────────────────────────────────────

type EventKind = 'agent' | 'system' | 'call' | 'meeting' | 'task'

interface EventMeta {
  label:       string
  value:       string
  statusLabel: string
  statusType:  'success' | 'warning' | 'info'
}

interface TimelineEvent {
  id:        string
  type:      EventKind
  title:     string
  role:      string
  time:      string
  timestamp: number   // epoch ms, for sorting — events with no date sort last
  content:   string
  meta?:     EventMeta
}

// ── Relative timestamp ────────────────────────────────────────────────────────

function relTime(iso: string | undefined | null): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) return 'Just now'
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return fmtDate(iso)
}

function toTimestamp(iso: string | undefined | null): number {
  if (!iso) return -Infinity
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? -Infinity : t
}

// ── Build synthesized lifecycle events from backend fields ────────────────────

function buildLifecycleEvents(property: RealEstateProperty): TimelineEvent[] {
  const {
    createdAt, modifiedAt, status, type, requestType,
    imagesIds, assignedUserName, propertyCode, price,
    locationName, regionLocationName,
  } = property

  const locationLabel = locationName?.trim() || regionLocationName?.trim() || null
  const events: TimelineEvent[] = []

  if (assignedUserName) {
    events.push({
      id:        'agent-assigned',
      type:      'agent',
      title:     assignedUserName,
      role:      'Listing Agent',
      time:      relTime(modifiedAt || createdAt),
      timestamp: toTimestamp(modifiedAt || createdAt),
      content:   `${assignedUserName} is managing this listing as the primary agent.${status ? ` Current status: ${status}.` : ''}`,
      meta:      price != null ? {
        label:       'Asking Price',
        value:       fmtPrice(price, false),
        statusLabel: status ?? 'Active',
        statusType:  status === 'Active' ? 'success'
                   : (status === 'Sold' || status === 'Rented') ? 'info'
                   : 'warning',
      } : undefined,
    })
  }

  if (imagesIds && imagesIds.length > 0) {
    events.push({
      id:        'gallery-published',
      type:      'system',
      title:     'Listing Media',
      role:      'Media Published',
      time:      relTime(modifiedAt || createdAt),
      timestamp: toTimestamp(modifiedAt || createdAt),
      content:   `${imagesIds.length} photo${imagesIds.length !== 1 ? 's' : ''} attached to this listing. Gallery is ready for buyer review.`,
      meta: {
        label:       'Photo Count',
        value:       `${imagesIds.length} photos`,
        statusLabel: 'Published',
        statusType:  'success',
      },
    })
  }

  const createdBody = [
    'Property record created and indexed.',
    type,
    locationLabel,
    requestType && `For ${requestType}`,
  ].filter(Boolean).join(' · ')

  events.push({
    id:        'listing-created',
    type:      'system',
    title:     'Property Registry',
    role:      'Listing Created',
    time:      relTime(createdAt),
    timestamp: toTimestamp(createdAt),
    content:   createdBody,
    meta:      propertyCode ? {
      label:       'Property Code',
      value:       `#${propertyCode}`,
      statusLabel: 'Indexed',
      statusType:  'info',
    } : undefined,
  })

  return events
}

// ── Build real activity events ─────────────────────────────────────────────────

function buildActivityEvents(
  calls: PropertyCallRef[], meetings: PropertyMeetingRef[], tasks: PropertyTaskRef[],
): TimelineEvent[] {
  const callEvents: TimelineEvent[] = calls.map(c => ({
    id: `call-${c.id}`, type: 'call', title: c.name, role: 'Call',
    time: relTime(c.dateStart), timestamp: toTimestamp(c.dateStart),
    content: `${c.status}${c.direction ? ` · ${c.direction}` : ''}`,
  }))
  const meetingEvents: TimelineEvent[] = meetings.map(m => ({
    id: `meeting-${m.id}`, type: 'meeting', title: m.name, role: 'Meeting',
    time: relTime(m.dateStart), timestamp: toTimestamp(m.dateStart),
    content: m.status,
  }))
  const taskEvents: TimelineEvent[] = tasks.map(t => ({
    id: `task-${t.id}`, type: 'task', title: t.name, role: 'Task',
    time: t.dateEnd ? `Due ${fmtDate(t.dateEnd)}` : '',
    timestamp: toTimestamp(t.dateEnd),
    content: t.status,
  }))
  return [...callEvents, ...meetingEvents, ...taskEvents]
}

// ── Visual treatment per event type ─────────────────────────────────────────────

const TYPE_ICON: Record<EventKind, React.ComponentType<{ className?: string }>> = {
  agent: MessageSquare, system: Activity, call: Phone, meeting: CalendarClock, task: ListChecks,
}

const TYPE_ICON_BG: Record<EventKind, string> = {
  agent: 'bg-primary', system: 'bg-foreground',
  call: 'bg-brand-azure', meeting: 'bg-purple-600', task: 'bg-amber-600',
}

const TYPE_ROLE_CLS: Record<EventKind, string> = {
  agent:   'bg-primary/5 text-primary',
  system:  'bg-muted text-muted-foreground',
  call:    'bg-brand-azure/10 text-brand-azure',
  meeting: 'bg-purple-500/10 text-purple-600',
  task:    'bg-amber-500/10 text-amber-600',
}

function statusDotCls(type: EventMeta['statusType']): string {
  return type === 'success' ? 'bg-brand-emerald'
       : type === 'warning' ? 'bg-amber-500'
       : 'bg-brand-azure'
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertyTimelineProps {
  property: RealEstateProperty
  calls:    PropertyCallRef[]
  meetings: PropertyMeetingRef[]
  tasks:    PropertyTaskRef[]
}

// Interaction Design Sprint 4 (2026-07-18). A property with heavy activity
// (many calls/meetings/tasks) previously rendered every event unconditionally
// — pure scroll cost with no way to see "recent" without passing "everything
// else" first. Collapsed to the most recent 6 by default; same data, same
// card, same order, just progressively disclosed.
const COLLAPSE_THRESHOLD = 6

export function PropertyTimeline({ property, calls, meetings, tasks }: PropertyTimelineProps) {
  const [expanded, setExpanded] = useState(false)
  const events = [...buildLifecycleEvents(property), ...buildActivityEvents(calls, meetings, tasks)]
    .sort((a, b) => b.timestamp - a.timestamp)

  const hasRealActivity = calls.length > 0 || meetings.length > 0 || tasks.length > 0
  const hasMore         = events.length > COLLAPSE_THRESHOLD
  const visibleEvents   = expanded ? events : events.slice(0, COLLAPSE_THRESHOLD)

  return (
    <section className="space-y-4">

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Timeline
        </h2>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2.5 py-1 bg-border/50 rounded-full">
          {events.length} event{events.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {visibleEvents.map(item => {
            const Icon = TYPE_ICON[item.type]
            return (
              <div key={item.id} className="p-6 relative timeline-node group hover:bg-muted/20 transition-colors duration-200">
                <div className="flex items-start gap-4">

                  <div className="relative z-10 timeline-line shrink-0">
                    <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md ${TYPE_ICON_BG[item.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{item.title}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${TYPE_ROLE_CLS[item.type]}`}>
                          {item.role}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                      {item.content}
                    </p>

                    {item.meta && (
                      <div className="flex items-center gap-8 bg-background/60 p-3 rounded-xl border border-border w-fit shadow-xs mt-3">
                        <div>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                            {item.meta.label}
                          </span>
                          <span className="text-base font-black text-foreground tracking-tight">
                            {item.meta.value}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                            Status
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusDotCls(item.meta.statusType)}`} />
                            <span className="text-[10px] font-black text-foreground uppercase">
                              {item.meta.statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-card py-2.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {expanded ? 'Show fewer events' : `Show all ${events.length} events`}
          <ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {!hasRealActivity && (
        <p className="text-[11px] text-muted-foreground/45">
          Real activity (calls, meetings, tasks) shown here is scoped to what you have access to — a colleague&apos;s activity on this listing may not appear.
        </p>
      )}
    </section>
  )
}
