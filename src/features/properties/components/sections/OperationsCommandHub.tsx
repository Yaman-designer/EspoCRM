'use client'

import {
  Settings, Building2,
  CheckCircle2, Layers,
  CalendarClock, KeyRound, Check,
  Phone, Video, ListTodo, UserRound,
  Activity as ActivityIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { getStatusLabel } from '../PropertyStatusBadge'
import type { OperationsViewModel } from '../../view-models/operations.viewmodel'

// Property Overview Header redesign (2026-07-18) — Command Hub section.
// Previously two cards built almost entirely from one repeated pattern:
// a giant (34px) numeral per fact, stacked one per row. That's the
// "wastes vertical space" finding from the UX audit — three 34px rows
// (Status/Type/Availability) cost roughly the vertical space of eight
// compact rows carrying the same information. Rebuilt as one card with
// explicit labeled sections (Property Status, Property Information,
// Listing Information, Assigned Agent, Activity, Quick Actions) and one
// consistent compact row density throughout.
//
// Enterprise architecture pass (2026-07-23). Status-bucket logic,
// date/boolean/teams formatting, and the completeness summary sentence
// used to live in local helpers in this file; all of it now arrives
// pre-shaped via `OperationsViewModel` (see
// view-models/operations.viewmodel.ts). The unused `onDelete` prop this
// component never actually called is also dropped here.

// ── Props ─────────────────────────────────────────────────────────────────────

interface OperationsCommandHubProps {
  viewModel: OperationsViewModel
  onEdit: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OperationsCommandHub({ viewModel, onEdit }: OperationsCommandHubProps) {
  const { t } = useTranslation('properties')
  const {
    isAvailable, statusValue, statusDotClass, statusBgClass, statusSub,
    propertyInfoParts, propertyCode, listingInfo,
    assignedAgentName, assignedAgentInitial,
    callCount, meetingCount, taskCount, hasActivity,
    officeNotes, aiEvaluatorNotes,
    completenessScore, completenessMissingFields, completenessTotalFields,
  } = viewModel

  const { copied, copy } = useCopyToClipboard()

  const yesNo = (v: boolean | null) => v == null ? '' : t(v ? 'common.yes' : 'common.no')
  const completenessSummary = completenessMissingFields.length > 0
    ? t('operations.completenessMissing', { fields: completenessMissingFields.join(', ') })
    : t('operations.completenessComplete', { count: completenessTotalFields })

  // Collapse-empty-rows pass. Listing Information used to always render all
  // 6 cells, showing "—" for whichever weren't set on this property — reads
  // as an unfilled form, not a summary. Filtered here (icons are
  // component-local; the view-model layer stays pure data, per its own
  // "no UI concerns" boundary) so the grid — and the section entirely, if
  // nothing survives — only ever shows fields that actually have a value.
  const listingInfoRows = [
    { key: 'availableFrom', icon: <CalendarClock className="size-3.5 text-muted-foreground/38" />, label: t('operations.listingInfo.availableFrom'), value: listingInfo.availableFrom },
    { key: 'nextUpdate',    icon: <CalendarClock className="size-3.5 text-muted-foreground/38" />, label: t('operations.listingInfo.nextUpdate'),    value: listingInfo.nextUpdate },
    { key: 'keysHeld',      icon: <KeyRound className="size-3.5 text-muted-foreground/38" />,       label: t('operations.listingInfo.keysHeld'),      value: yesNo(listingInfo.keysHeld) },
    { key: 'sold',          icon: <CheckCircle2 className="size-3.5 text-muted-foreground/38" />,   label: t('operations.listingInfo.sold'),          value: yesNo(listingInfo.sold) },
    { key: 'ownerAccount',  icon: <Building2 className="size-3.5 text-muted-foreground/38" />,      label: t('operations.listingInfo.ownerAccount'),  value: listingInfo.ownerAccount },
    { key: 'teams',         icon: <Layers className="size-3.5 text-muted-foreground/38" />,         label: t('operations.listingInfo.teams'),         value: listingInfo.teams },
    // availableFrom/nextUpdate go through the shared formatDateGB() (see
    // operations.viewmodel.ts), which returns the literal '—' placeholder
    // for a missing date rather than '' — that utility is shared with other
    // consumers that DO want an inline dash, so it stays as-is; filtered out
    // here instead, alongside the plain-empty-string case from the other
    // fields.
  ].filter(row => row.value !== '' && row.value !== '—')

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
                {t('operations.eyebrow')}
              </p>
              <p className="text-[15px] font-black leading-tight text-foreground">
                {t('operations.title')}
              </p>
            </div>
          </div>
          <div className={cn('size-2.5 rounded-full', isAvailable ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/20')} />
        </div>

        {/* ── Property Status — Command Hub Visual Refinement pass
            (2026-07-22). The header's pulsing dot already carries the
            available/unavailable signal at a glance; this section still
            exists to say the one thing the dot can't — the precise status
            name. Given the same rounded-card treatment as Assigned Agent,
            but tinted by the status's own semantic color (statusBgClass,
            sharing its condition logic with the dot) so this is the one
            card in the sidebar whose color genuinely reflects the data. ── */}
        <SectionHeader label={t('operations.sections.propertyStatus')} />
        <div className="px-5 pb-2.5">
          <div className={cn('flex items-center gap-3 rounded-xl px-4 py-2.5', statusBgClass)}>
            <span className={cn(
              'size-2 shrink-0 rounded-full',
              statusDotClass,
              isAvailable && 'animate-pulse motion-reduce:animate-none',
            )} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-black leading-tight text-foreground truncate">{getStatusLabel(statusValue, t)}</p>
              {statusSub && (
                <p className="text-[10px] font-semibold text-muted-foreground/50 truncate">{t(`operations.commandHubStatusSub.${statusSub}`)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Property Information — final polish pass: replaced the
            icon/label/value row stack (Type row, category chips) with one
            flowing fact line — reads like a description, not a settings
            table. The ref code is a quiet utility beneath it, not another
            row in the same list.
            Information Architecture review (2026-07-22): Type, Category,
            and Property Code here also appear in the Hero (Type as a photo
            badge; Property Code as a mono tag beside the title). Reviewed
            and kept, not an oversight — this card is a `sticky` sidebar
            (see the wrapper below), visible for the entire time a reader is
            scrolling Financial/Location/Specs further down the page, long
            after the Hero has scrolled out of view. Recognition-over-recall
            for "what am I looking at" while deep in the page is the whole
            job of a persistent nav rail (the same reasoning behind Stripe's
            sticky customer header or GitHub's sticky repo header staying on
            screen while the page below it scrolls) — a structurally
            different role from the one-time identity read the Hero
            provides on first arrival. Property Code additionally powers a
            real action here (the copy button below) that the Hero's own
            badge doesn't offer, which is its own independent justification
            regardless of the sticky-orientation argument. ── */}
        <SectionHeader label={t('operations.sections.propertyInformation')} />
        <div className="px-5 pb-2.5">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] font-semibold text-foreground/75">
            {propertyInfoParts.length > 0 ? (
              propertyInfoParts.map((val, i, arr) => (
                <span key={val} className="flex items-center gap-1.5">
                  {val}
                  {i < arr.length - 1 && <span className="text-muted-foreground/25">·</span>}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground/35">—</span>
            )}
          </div>
          {propertyCode && (
            <button
              type="button"
              onClick={() => copy(propertyCode)}
              aria-label={copied ? t('operations.propertyCodeCopied') : t('operations.copyPropertyCode', { code: propertyCode })}
              className="mt-1.5 -ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground/40 transition-colors hover:bg-muted/8 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {copied ? (<><Check className="size-2.5 text-emerald-600" /><span className="text-emerald-600">{t('common.copied')}</span></>) : `#${propertyCode}`}
            </button>
          )}
        </div>

        {/* ── Listing Information — hidden entirely when this property has
            none of these 6 fields set, collapsed to just the rows that do
            (see listingInfoRows above) rather than a full grid of dashes. ── */}
        {listingInfoRows.length > 0 && (
          <>
            <SectionHeader label={t('operations.sections.listingInformation')} />
            <div className="px-5 pb-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {listingInfoRows.map(row => (
                <CompactRow key={row.key} icon={row.icon} label={row.label} value={row.value} />
              ))}
            </div>
          </>
        )}

        {/* ── Assigned Agent ── */}
        <SectionHeader label={t('operations.sections.assignedAgent')} />
        <div className="px-5 pb-2.5">
          {assignedAgentName ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/6 px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-primary/12 ring-1 ring-border/25">
                <span className="text-[13px] font-black text-primary">
                  {assignedAgentInitial}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black leading-tight text-foreground">{assignedAgentName}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/80">{t('operations.listingAgent')}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/25 px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/20 bg-muted/20">
                <UserRound className="size-4 text-muted-foreground/35" />
              </div>
              <p className="text-[11.5px] font-semibold text-muted-foreground/45">{t('operations.noAgentAssigned')}</p>
            </div>
          )}
        </div>

        {/* ── Activity — real counts from already-fetched calls/meetings/
            tasks (Sprint 1). ── */}
        <SectionHeader label={t('operations.sections.activity')} />
        <div className="px-5 pb-2.5">
          {hasActivity ? (
            <div className="grid grid-cols-3 gap-2">
              <ActivityStat icon={<Phone className="size-3.5" />} count={callCount} label={t('operations.calls')} />
              <ActivityStat icon={<Video className="size-3.5" />} count={meetingCount} label={t('operations.meetings')} />
              <ActivityStat icon={<ListTodo className="size-3.5" />} count={taskCount} label={t('operations.tasks')} />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/25 px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/20 bg-muted/20">
                <ActivityIcon className="size-4 text-muted-foreground/35" />
              </div>
              <p className="text-[11.5px] font-semibold text-muted-foreground/45">{t('operations.noActivityLogged')}</p>
            </div>
          )}
        </div>

        {/* Office Notes — internal-only, free text; only rendered when present */}
        {officeNotes && (
          <div className="border-t border-border/8 px-5 py-3">
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">{t('operations.officeNotes')}</p>
            <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-foreground/70">{officeNotes}</p>
          </div>
        )}

        {/* AI Property Evaluator — internal tool output, same treatment as Office Notes */}
        {aiEvaluatorNotes && (
          <div className="border-t border-border/8 px-5 py-3">
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">{t('operations.aiEvaluator')}</p>
            <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-foreground/70">{aiEvaluatorNotes}</p>
          </div>
        )}

        {/* Property Completeness */}
        <div className="border-t border-border/8 px-5 py-3">
          <div className="mb-2.5 flex items-baseline justify-between gap-2">
            <p className="text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">{t('operations.completeness')}</p>
            <span className="text-[11px] font-black text-foreground tabular-nums">
              {completenessScore}<span className="text-[9px] font-bold text-muted-foreground/40">%</span>
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted/15 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary/70 to-primary transition-all duration-700 ease-out"
              style={{ width: `${completenessScore}%` }}
            />
          </div>
          <p className="mt-2 truncate text-[9px] font-semibold text-muted-foreground/35">
            {completenessSummary}
          </p>
        </div>

        {/* ── Quick Actions — Product UX pass (2026-07-24). Share/Print/
            Timeline removed: Share pointed at this authenticated dashboard
            URL (useless to anyone without CRM access, and any teammate who
            does have access can already reach this record via search —
            wasn't a real collaboration path); Print had no print stylesheet
            anywhere in the app, so it produced the raw dashboard chrome, not
            a usable document; Timeline duplicated the "Timeline" entry
            already in PropertySectionNav's sticky section nav one scroll
            away. None were removed in favor of anything — Edit Property is
            the one genuinely high-frequency action here and now gets the
            full card width instead of competing with a row that, on
            inspection, didn't earn permanent placement. If Share is ever
            wanted again, it belongs as a real external listing link once
            one exists — not a copy of this internal URL. ── */}
        <SectionHeader label={t('operations.sections.quickActions')} divider />
        {/* Button System — Variant 1 (Primary Action). Was `bg-foreground`
            (near-black) — a second, independently-invented "solid heaviest
            weight" color competing with PropertyCard's `bg-primary` CTA for
            the same underlying action elsewhere on this page. Recolored to
            the one actual primary token; shape (full-width, uppercase,
            tight tracking) stays as-is, since that's a legitimate,
            context-specific choice for this sidebar (its own single quick
            action), not part of what Variant 1 mandates being identical.
            Also fixes a real a11y gap: `focus-visible:outline-none` had no
            replacement ring, so keyboard focus was invisible here — now
            uses the same ring-4 ring-ring/20 as every other Primary/
            Secondary button. */}
        <div className="px-5 pb-4">
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-xl bg-primary py-3.5 text-[8.5px] font-black uppercase tracking-[0.18em] text-primary-foreground shadow-design-md transition-all duration-250 ease-in-out hover:bg-primary/90 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-ring/20 motion-reduce:transition-colors motion-reduce:active:scale-100"
          >
            {t('operations.editProperty')}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ label, divider = false }: { label: string; divider?: boolean }) {
  return (
    <div className={cn('flex items-center gap-1.5 px-5 pt-3 pb-1.5', divider && 'border-t border-border/8 mt-1')}>
      <span className="size-1 rounded-full bg-primary/40" />
      <p className="text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">{label}</p>
    </div>
  )
}

// ── CompactRow — single-line label/value. Callers only ever pass rows that
// already have a value (see listingInfoRows' filter above), so there's no
// empty-state branch to handle here. ─────────────────────────────────────

function CompactRow({
  icon, label, value,
}: {
  icon:  React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {icon}
      <span className="text-[10.5px] font-semibold text-muted-foreground/60 truncate">{label}</span>
      <span className="ml-auto shrink-0 text-[11.5px] font-black truncate max-w-24 text-foreground/80">
        {value}
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
