'use client'

import {
  Settings, Building2,
  CheckCircle2, Layers,
  CalendarClock, KeyRound, Check,
  Share2, Printer, History,
  Phone, Video, ListTodo, UserRound,
  Activity as ActivityIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataCompleteness } from '../../lib/data-completeness'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import type { RealEstateProperty } from '../../types/property.types'

// Property Overview Header redesign (2026-07-18) — Command Hub section.
// Previously two cards built almost entirely from one repeated pattern:
// a giant (34px) numeral per fact, stacked one per row. That's the
// "wastes vertical space" finding from the UX audit — three 34px rows
// (Status/Type/Availability) cost roughly the vertical space of eight
// compact rows carrying the same information. Rebuilt as one card with
// explicit labeled sections (Property Status, Property Information,
// Listing Information, Assigned Agent, Activity, Quick Actions) and one
// consistent compact row density throughout.

// ── Props ─────────────────────────────────────────────────────────────────────

interface OperationsCommandHubProps {
  property: RealEstateProperty
  onEdit:   () => void
  onDelete: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return '—'
  }
}

// Wave 2 (2026-07-14): rebuilt for the real 8-value live status enum — see
// the approved Product Decision Record for the old→new mapping.
function getStatusSub(status: string): string {
  switch (status) {
    case 'Active':              return 'Open for offers'
    case 'Under negotiation':   return 'Hold placed'
    case 'Received payment':    return 'Awaiting completion'
    case 'Under Approval':      return 'In approval'
    case 'Not Approved':        return 'Needs revision'
    case 'Sold':                return 'Transaction complete'
    case 'Rented':               return 'Lease active'
    case 'Inactive':            return 'Not currently published'
    default:                    return ''
  }
}

function statusDotClass(status: string, isAvailable: boolean): string {
  if (isAvailable) return 'bg-emerald-500'
  if (status === 'Under Approval' || status === 'Not Approved') return 'bg-rose-500'
  if (status === 'Under negotiation' || status === 'Received payment') return 'bg-amber-500'
  return 'bg-muted-foreground/30'
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Fields tracked in getDataCompleteness missing[]
const TOTAL_TRACKED = 7

// ── Component ─────────────────────────────────────────────────────────────────

export function OperationsCommandHub({ property, onEdit }: OperationsCommandHubProps) {
  const { copied, copy } = useCopyToClipboard()
  const { copied: linkCopied, copy: copyLink } = useCopyToClipboard()
  const completeness   = getDataCompleteness(property)
  const isAvailable    = property.status === 'Active'
  const statusValue    = property.status ?? '—'
  const populatedCount = TOTAL_TRACKED - completeness.missing.length

  const callCount    = property.calls?.length    ?? 0
  const meetingCount = property.meetings?.length  ?? 0
  const taskCount     = property.tasks?.length     ?? 0
  const hasActivity   = callCount + meetingCount + taskCount > 0

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: property.title || property.propertyCode || 'Property', url }).catch(() => { /* cancelled — no-op */ })
      return
    }
    void copyLink(url)
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print()
  }

  function handleOpenTimeline() {
    document.getElementById('section-timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-4 xl:sticky xl:top-20">

      <div className={cn('overflow-hidden rounded-2xl bg-card', 'border border-border/30', 'shadow-design-lg')}>

        {/* ── Header ── */}
        <div className="h-1 bg-linear-to-r from-primary via-primary/55 to-transparent" />
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/8">
              <Settings className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.26em] text-muted-foreground/38">
                Operations
              </p>
              <p className="text-[15px] font-black leading-tight text-foreground">
                Command Hub
              </p>
            </div>
          </div>
          <div className={cn('size-2.5 rounded-full', isAvailable ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/20')} />
        </div>

        {/* ── Property Status — the header's pulsing dot already carries
            the available/unavailable signal at a glance; this row exists
            only to say the one thing the dot can't — the precise status
            name. ── */}
        <SectionHeader label="Property Status" />
        <div className="px-5 pb-2.5 flex items-center gap-2.5">
          <span className={cn('size-1.5 shrink-0 rounded-full', statusDotClass(statusValue, isAvailable))} />
          <p className="text-[13.5px] font-bold text-foreground truncate">{statusValue}</p>
          {getStatusSub(statusValue) && (
            <p className="text-[10.5px] font-medium text-muted-foreground/45 truncate">— {getStatusSub(statusValue)}</p>
          )}
        </div>

        {/* ── Property Information — final polish pass: replaced the
            icon/label/value row stack (Type row, category chips) with one
            flowing fact line — reads like a description, not a settings
            table. The ref code is a quiet utility beneath it, not another
            row in the same list. ── */}
        <SectionHeader label="Property Information" />
        <div className="px-5 pb-2.5">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] font-semibold text-foreground/75">
            {[property.type, property.category, property.cAssignment].filter(Boolean).length > 0 ? (
              [property.type, property.category, property.cAssignment].filter(Boolean).map((val, i, arr) => (
                <span key={val} className="flex items-center gap-1.5">
                  {val}
                  {i < arr.length - 1 && <span className="text-muted-foreground/25">·</span>}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground/35">—</span>
            )}
          </div>
          {property.propertyCode && (
            <button
              type="button"
              onClick={() => copy(property.propertyCode!)}
              aria-label={copied ? 'Property code copied' : `Copy property code ${property.propertyCode}`}
              className="mt-1.5 -ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground/40 transition-colors hover:bg-muted/8 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {copied ? (<><Check className="size-2.5 text-emerald-600" /><span className="text-emerald-600">Copied</span></>) : `#${property.propertyCode}`}
            </button>
          )}
        </div>

        {/* ── Listing Information ── */}
        <SectionHeader label="Listing Information" />
        <div className="px-5 pb-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
          <CompactRow icon={<CalendarClock className="size-3.5 text-muted-foreground/38" />} label="Available From" value={formatDate(property.cAvailableFrom)} />
          <CompactRow icon={<CalendarClock className="size-3.5 text-muted-foreground/38" />} label="Next Update" value={formatDate(property.nextUpdate)} />
          <CompactRow icon={<KeyRound className="size-3.5 text-muted-foreground/38" />} label="Keys Held" value={property.keys == null ? '' : property.keys ? 'Yes' : 'No'} />
          <CompactRow icon={<CheckCircle2 className="size-3.5 text-muted-foreground/38" />} label="Sold" value={property.cSold == null ? '' : property.cSold ? 'Yes' : 'No'} />
          <CompactRow icon={<Building2 className="size-3.5 text-muted-foreground/38" />} label="Owner Account" value={property.accountName ?? ''} />
          <CompactRow icon={<Layers className="size-3.5 text-muted-foreground/38" />} label="Teams" value={property.teamsNames ? Object.values(property.teamsNames).join(', ') : ''} />
        </div>

        {/* ── Assigned Agent ── */}
        <SectionHeader label="Assigned Agent" />
        <div className="px-5 pb-2.5">
          {property.assignedUserName ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/6 px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-primary/12 ring-1 ring-border/25">
                <span className="text-[13px] font-black text-primary">
                  {property.assignedUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black leading-tight text-foreground">{property.assignedUserName}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/80">Listing Agent</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/25 px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/20 bg-muted/20">
                <UserRound className="size-4 text-muted-foreground/35" />
              </div>
              <p className="text-[11.5px] font-semibold text-muted-foreground/45">No agent assigned</p>
            </div>
          )}
        </div>

        {/* ── Activity — real counts from already-fetched calls/meetings/
            tasks (Sprint 1), plus the record's own last-modified date. No
            new fetch, no fabricated numbers. Final polish pass adds a
            proper empty state — a soft dashed icon chip instead of a
            stray line of gray text. ── */}
        <SectionHeader label="Activity" />
        <div className="px-5 pb-2.5">
          {hasActivity ? (
            <div className="grid grid-cols-3 gap-2">
              <ActivityStat icon={<Phone className="size-3.5" />} count={callCount} label="Calls" />
              <ActivityStat icon={<Video className="size-3.5" />} count={meetingCount} label="Meetings" />
              <ActivityStat icon={<ListTodo className="size-3.5" />} count={taskCount} label="Tasks" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-border/25">
                <ActivityIcon className="size-3.5 text-muted-foreground/35" />
              </div>
              <p className="text-[10.5px] font-semibold text-muted-foreground/40">No activity logged yet</p>
            </div>
          )}
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-semibold text-muted-foreground/40">
            <span>Created {formatDate(property.createdAt)}</span>
            <span>Updated {formatDate(property.modifiedAt)}</span>
          </div>
        </div>

        {/* Office Notes — internal-only, free text; only rendered when present */}
        {property.cOfficeNotes && (
          <div className="border-t border-border/8 px-5 py-3">
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">Office Notes</p>
            <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-foreground/70">{property.cOfficeNotes}</p>
          </div>
        )}

        {/* AI Property Evaluator — internal tool output, same treatment as Office Notes */}
        {property.cPropertyEvaluatorAI && (
          <div className="border-t border-border/8 px-5 py-3">
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">AI Property Evaluator</p>
            <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-foreground/70">{property.cPropertyEvaluatorAI}</p>
          </div>
        )}

        {/* Property Completeness — final polish pass: the percentage is
            now the prominent figure (tabular numerals, larger than any
            other Command Hub caption), the fill carries a subtle gradient
            instead of a flat tone, and "X of Y fields" drops to a quiet
            caption beneath rather than sharing top billing. */}
        <div className="border-t border-border/8 px-5 py-3">
          <div className="mb-2.5 flex items-baseline justify-between gap-2">
            <p className="text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">Completeness</p>
            <span className="text-[11px] font-black text-foreground tabular-nums">
              {completeness.score}<span className="text-[9px] font-bold text-muted-foreground/40">%</span>
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted/15 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary/70 to-primary transition-all duration-700 ease-out"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          <p className="mt-2 text-[9px] font-semibold text-muted-foreground/35">{populatedCount} of {TOTAL_TRACKED} fields</p>
        </div>

        {/* ── Quick Actions — Edit Property is the one primary action;
            Share, Print and Timeline are secondary. Nothing here is a
            placeholder for a future feature, so there's nothing to defer
            behind an overflow menu. ── */}
        <SectionHeader label="Quick Actions" divider />
        <div className="px-5 pb-4">
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-xl bg-foreground py-3.5 text-[8.5px] font-black uppercase tracking-[0.18em] text-white shadow-design-md transition-opacity hover:opacity-88 focus-visible:outline-none mb-2.5"
          >
            Edit Property
          </button>
          <div className="grid grid-cols-3 gap-2">
            <QuickAction icon={linkCopied ? Check : Share2} label={linkCopied ? 'Copied' : 'Share'} onClick={handleShare} done={linkCopied} />
            <QuickAction icon={Printer} label="Print" onClick={handlePrint} />
            <QuickAction icon={History} label="Timeline" onClick={handleOpenTimeline} />
          </div>
        </div>

      </div>
    </div>
  )
}

// ── SectionHeader ────────────────────────────────────────────────────────────
// Final polish pass: dropped the top hairline from every section — six
// dividers sliced the card into six little boxes, working against "each
// section should feel naturally connected to the next." Rhythm now comes
// from spacing and the small accent dot alone; a divider is reserved for
// the one place a real seam belongs — between the info sections and the
// actions footer.

function SectionHeader({ label, divider = false }: { label: string; divider?: boolean }) {
  return (
    <div className={cn('flex items-center gap-1.5 px-5 pt-3 pb-1.5', divider && 'border-t border-border/8 mt-1')}>
      <span className="size-1 rounded-full bg-primary/40" />
      <p className="text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">{label}</p>
    </div>
  )
}

// ── CompactRow — single-line label/value, replaces the old giant MetricRow
// and separate EntityRow with one consistent, denser pattern. ─────────────

function CompactRow({
  icon, label, value,
}: {
  icon:  React.ReactNode
  label: string
  value: string
}) {
  const isEmpty = !value
  return (
    <div className="flex items-center gap-2 min-w-0">
      {icon}
      <span className="text-[10.5px] font-semibold text-muted-foreground/60 truncate">{label}</span>
      <span className={cn(
        'ml-auto shrink-0 text-[11.5px] font-black truncate max-w-24',
        isEmpty ? 'text-muted-foreground/30' : 'text-foreground/80',
      )}>
        {isEmpty ? '—' : value}
      </span>
    </div>
  )
}

// ── ActivityStat ──────────────────────────────────────────────────────────────

function ActivityStat({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <div className="text-muted-foreground/45">{icon}</div>
      <span className="text-[13px] font-black text-foreground leading-none">{count}</span>
      <span className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground/40">{label}</span>
    </div>
  )
}

// ── QuickAction ───────────────────────────────────────────────────────────────
// Luxury polish pass: ghost buttons — icon, label, hover wash — instead of
// individually bordered/filled tiles. The "coming soon" tier (Export PDF,
// Duplicate, Schedule Visit) was removed outright rather than kept as
// disabled UI: three buttons that do nothing don't serve the primary
// workflow, so they're gone, not just dimmed.

function QuickAction({
  icon: Icon, label, onClick, done,
}: {
  icon:     React.ComponentType<{ className?: string }>
  label:    string
  onClick?: () => void
  done?:    boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-done={done}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg py-2.5 transition-colors',
        'hover:bg-muted/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
    >
      <Icon className={cn('size-3.5', done ? 'text-emerald-600' : 'text-muted-foreground/55')} />
      <span className="text-[7.5px] font-bold uppercase tracking-wide text-center leading-tight px-0.5 text-muted-foreground/55">
        {label}
      </span>
    </button>
  )
}
