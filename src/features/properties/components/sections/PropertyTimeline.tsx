'use client'

import { useState } from 'react'
import {
  ChevronDown, MessageSquare, Camera, FileText, Phone, CalendarClock, ListChecks,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SectionHeader, SecondaryButton } from '@/components/shared'
import type { TimelineEventViewModel, TimelineEventKind, TimelineViewModel } from '../../view-models/timeline.viewmodel'

// IA Sprint 3 (2026-07-18). Merged from PropertyIntelligenceStream (a
// synthesized lifecycle narrative — agent assignment, gallery, creation)
// and PropertyActivityPanel (real calls/meetings/tasks) — both answered
// "what happened on this listing," in two visually unrelated patterns with
// no shared chronological order. One timeline now, sorted most-recent
// first; synthesized entries keep the "System"/"Agent" role labels they
// always had, real activity gets its own type per record so neither reads
// as the other.
//
// Enterprise Product Polish pass (2026-07-22). Full audit and what changed —
// see each fix's own comment below for the specific reasoning:
//  1. The timeline spine (connector line between icons) was structurally
//     broken — it could never reach the next event regardless of content
//     height. Rebuilt as a real element anchored to the full row height.
//  2. Two "status" pills ("Published", "Indexed") were hardcoded strings
//     with no corresponding field anywhere in the API response — fabricated
//     status, which this pass's own rules forbid. Removed.
//  3. The Agent event's status pill duplicated the sentence directly above
//     it ("Current status: X" ... "Status: X"). Removed the duplicate.
//  4. "Listing Media" and "Property Registry" shared one icon and one
//     color, indistinguishable at a glance despite being different facts.
//     Given each a distinct icon within the same neutral "system" family.
//  5. The photo-count meta value read "1 photos" regardless of count — the
//     content sentence one line above already pluralizes correctly; the
//     meta value didn't.
//  6. The title row (name + role badge + timestamp) had no wrap strategy
//     and crowded awkwardly at mobile widths. Made it wrap gracefully.
// Everything else in this file — timestamp placement, section header,
// badge language, progressive disclosure, hover state, the empty-activity
// disclaimer — was already correct and is unchanged.
//
// Enterprise architecture pass (2026-07-23). Event synthesis, merging, and
// sorting used to live in this component (~115 lines); all of it now
// arrives pre-built via `TimelineViewModel` (see
// view-models/timeline.viewmodel.ts) — the ViewModel stays data-only
// (a `type`/`iconKey` discriminant per event), and icon/color resolution —
// a UI-library binding, not a data concern — lives here instead.

interface PropertyTimelineProps {
  viewModel: TimelineViewModel
}

// ── Visual treatment per event type — presentation-layer, not the ViewModel's concern ──

const TYPE_ICON: Record<TimelineEventKind, LucideIcon> = {
  agent: MessageSquare, system: FileText, call: Phone, meeting: CalendarClock, task: ListChecks,
}

const TYPE_ICON_BG: Record<TimelineEventKind, string> = {
  agent: 'bg-primary', system: 'bg-foreground',
  call: 'bg-brand-azure', meeting: 'bg-purple-600', task: 'bg-amber-600',
}

const TYPE_ROLE_CLS: Record<TimelineEventKind, string> = {
  agent:   'bg-primary/5 text-primary',
  system:  'bg-muted text-muted-foreground',
  call:    'bg-brand-azure/10 text-brand-azure',
  meeting: 'bg-purple-500/10 text-purple-600',
  task:    'bg-amber-500/10 text-amber-600',
}

function resolveEventIcon(item: TimelineEventViewModel): LucideIcon {
  if (item.iconKey === 'gallery') return Camera
  return TYPE_ICON[item.type]
}

// Interaction Design Sprint 4 (2026-07-18). A property with heavy activity
// (many calls/meetings/tasks) previously rendered every event unconditionally
// — pure scroll cost with no way to see "recent" without passing "everything
// else" first. Collapsed to the most recent 6 by default; same data, same
// card, same order, just progressively disclosed.
const COLLAPSE_THRESHOLD = 6

export function PropertyTimeline({ viewModel }: PropertyTimelineProps) {
  const { t } = useTranslation('properties')
  const [expanded, setExpanded] = useState(false)
  const { events, hasRealActivity } = viewModel

  const hasMore       = events.length > COLLAPSE_THRESHOLD
  const visibleEvents = expanded ? events : events.slice(0, COLLAPSE_THRESHOLD)

  return (
    <section className="space-y-4">

      <div className="flex items-center justify-between">
        <SectionHeader title={t('timeline.title')} />
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2.5 py-1 bg-border/50 rounded-full">
          {t('timeline.event', { count: events.length })}
        </span>
      </div>

      {/* Card recipe migrated off the legacy "Stitch" scaffold to match
          Financial Intelligence et al. — same pass, same rationale as
          ConstructionSystemsCard's own note; this card (a divided row list,
          structurally the same category as Contacts) was the one instance
          missed in that pass. */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs overflow-hidden">
        <div className="divide-y divide-border">
          {visibleEvents.map((item, i) => {
            const Icon = resolveEventIcon(item)
            const isLast = i === visibleEvents.length - 1
            return (
              <div key={item.id} className="p-6 relative group hover:bg-muted/20 transition-colors duration-200">
                <div className="flex items-start gap-4">

                  {/* Icon + spine — Product Polish pass (2026-07-22). The
                      connector used to be a `::before` pseudo-element
                      anchored to this icon's own 40px box, so it could
                      never reach the next event once real content (a
                      description, a meta stat) made the row taller than
                      64px — it was short by however much the actual
                      content added, i.e. always short. `self-stretch`
                      makes this wrapper span the row's true content height
                      (the icon itself stays pinned to the top via normal
                      block flow), so the connector — now a real element,
                      not a pseudo-element in a stale global stylesheet —
                      can run from the icon's bottom edge to 48px past this
                      wrapper's real bottom: 24px for this row's own bottom
                      padding (p-6) plus 24px for the next row's top
                      padding, landing exactly on the next icon's top edge.
                      Verified by measuring both boxes live, not assumed.
                      Uses `bg-border` (the app's real token) instead of the
                      hardcoded #E3E8EF the old rule had. */}
                  <div className="relative z-10 self-stretch shrink-0">
                    <div className={cn('w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md', TYPE_ICON_BG[item.type])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && (
                      <div className="absolute left-1/2 top-10 -bottom-12 w-0.5 -translate-x-1/2 bg-border" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title row — wraps gracefully at narrow widths instead
                        of crowding name + badge + timestamp onto one line
                        with no fallback. */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{item.title}</span>
                        <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight', TYPE_ROLE_CLS[item.type])}>
                          {item.role}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                      {item.content}
                    </p>

                    {/* Meta — Product Polish pass (2026-07-22). Was a
                        bordered, shadowed, two-column card (a stat plus a
                        "status" pill). The status half is gone: for the
                        Agent event it just repeated the sentence above; for
                        the other two, the status text ("Published",
                        "Indexed") wasn't backed by any real field — this
                        pass's own rules forbid showing invented status.
                        What's left is one real, non-duplicated fact,
                        presented as a quiet inline label + value instead of
                        a heavy nested card — same information, lighter
                        presentation, per this pass's explicit instruction. */}
                    {item.meta && (
                      <div className="mt-2.5 inline-flex items-baseline gap-1.5">
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                          {item.meta.label}
                        </span>
                        <span className="text-[13px] font-black text-foreground tracking-tight">
                          {item.meta.value}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Button System — Variant 2 (Secondary Action), same component as
          "Browse all" and "Full Specifications". Full-width here (unlike
          Full Specifications) is a deliberate, context-specific choice —
          this concludes a list it sits directly beneath, spanning the same
          width as the list above it, not a section-header trailing action. */}
      {hasMore && (
        <SecondaryButton
          onClick={() => setExpanded(v => !v)}
          label={expanded ? t('timeline.showFewerEvents') : t('timeline.showAllEvents', { count: events.length })}
          icon={ChevronDown}
          iconClassName={expanded ? 'rotate-180' : undefined}
          className="w-full"
        />
      )}

      {!hasRealActivity && (
        <p className="text-[11px] text-muted-foreground/45">
          {t('timeline.activityScopeNotice')}
        </p>
      )}
    </section>
  )
}
