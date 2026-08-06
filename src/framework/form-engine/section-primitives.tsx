'use client'

import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isFieldVisible, evaluateCondition } from './VisibilityEngine'
import { GridEngine } from './GridEngine'
import type { FieldSchema, SectionSchema, FieldOption } from './types'

// ── Shared section-chrome primitives ────────────────────────────────────────
// Design-System pass: every wizard step was independently re-implementing
// its own copy of the same two ideas — a small uppercase caption for an
// internal sub-cluster of fields, and a "how much of this section is filled
// in" completion computation + badge. `GroupCaption` existed, byte-for-byte
// identical, in both LocationZoningStepView.tsx and PricingTermsStepView.tsx.
// The completion logic existed twice too: once inside SectionRenderer.tsx
// (`getFieldSummary`, surfaced only in its collapsed-bar state) and once
// inside IdentityGovernanceStepView.tsx's `CompactSectionCard`
// (`getSectionCompletion`, its own separate implementation, its own badge
// JSX) — meaning the ambient "3/5" progress feedback Step 1's users got was
// never something SectionRenderer itself provided; it only existed because
// Step 1 happened to hand-build it. Every other step (2 through 7) had no
// equivalent, not because it was a wrong fit for them, but because nothing
// shared existed to give it to them.
//
// Both are promoted here so every consumer — SectionRenderer's own open-card
// header, its collapsed-bar summary, and any bespoke step view — reads from
// one implementation. A future typography or scoring change made here
// reaches every step automatically, which is the whole point.

/** The one small-caption device used to label an internal sub-cluster of
 *  fields within a section's body (e.g. Step 2's "Narrowing"/"Address",
 *  Step 3's "Comparison"/"Financial Characteristics"). */
export function GroupCaption({ text }: { text: string }) {
  if (!text) return null
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
      {text}
    </p>
  )
}

export interface SectionCompletionSummary {
  visibleCount: number
  filledCount: number
  isComplete: boolean
}

const HTML_TAG_RE = /<[^>]*>/g

/** The single source of truth for "does this field count as filled" — every
 *  completion/violation computation in the wizard (this section's own
 *  getSectionCompletion below, and ReviewStep.tsx's per-step completion +
 *  required-field violation list) must derive from this one implementation,
 *  never keep its own parallel copy. Exported so ReviewStep can share it
 *  instead of re-deriving its own (previously divergent — see the boolean
 *  and rich-text cases below) definition of "empty". */
export function isFilled(value: unknown, field: FieldSchema): boolean {
  if (value === undefined || value === null || value === '') return false
  // Switch/checkbox fields store a plain boolean — `false` is their empty
  // (untoggled) state, not a filled value, so it must not count toward
  // completion. Without this, `!Array.isArray(false)` is true and every
  // OFF field is (incorrectly) reported as filled. Scoped to switch/checkbox
  // only — a select/radio field can legitimately have a boolean *option*
  // value (e.g. a Yes/No dropdown), where `false` means "explicitly chose
  // No" (filled), not "nothing chosen" (that case already reads as `null`).
  if ((field.type === 'switch' || field.type === 'checkbox') && typeof value === 'boolean') {
    return value === true
  }
  // Tiptap (rich-text) serializes its empty state to a non-empty string
  // like "<p></p>", never "" — stripping tags is required to tell "user
  // deleted all their text" apart from "user typed something".
  if (field.type === 'rich-text' && typeof value === 'string') {
    return value.replace(HTML_TAG_RE, '').trim().length > 0
  }
  return !Array.isArray(value) || value.length > 0
}

/** One completion computation for a section — how many of its currently
 *  visible fields are filled, and whether every currently-required one is.
 *  Shared by SectionRenderer's own collapsed-bar summary and by any
 *  bespoke section-like card (e.g. Step 1's CompactSectionCard), which
 *  previously kept its own independent copy of this exact logic with no
 *  guarantee the two would ever agree. */
export function getSectionCompletion(
  section: Pick<SectionSchema, 'fields'>,
  values: Record<string, unknown>,
): SectionCompletionSummary {
  const visible = section.fields.filter(f => f.type !== 'hidden' && isFieldVisible(f.visibility, values))
  const filled = visible.filter(f => isFilled(values[f.key], f))
  const isRequired = (f: FieldSchema) =>
    !!f.required || (f.requiredWhen ? evaluateCondition(f.requiredWhen, values) : false)
  const requiredCount = visible.filter(isRequired).length
  const requiredFilledCount = filled.filter(isRequired).length
  return {
    visibleCount: visible.length,
    filledCount: filled.length,
    isComplete: requiredCount === 0 || requiredFilledCount >= requiredCount,
  }
}

/** The ambient "3/5" progress pill — previously only ever built by Step 1's
 *  CompactSectionCard. Promoted here so SectionRenderer's own open-card
 *  header (every step that renders through the generic engine — currently
 *  Steps 2 through 7) shows the exact same ambient feedback Step 1 already
 *  gave its users, instead of that signal existing on one step by accident
 *  of which file happened to build it locally. */
export function SectionCompletionBadge({ visibleCount, filledCount, isComplete }: SectionCompletionSummary) {
  if (visibleCount === 0) return null
  const filledAndComplete = filledCount > 0 && isComplete
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums transition-colors duration-200',
        filledAndComplete
          ? 'bg-brand-emerald-soft/40 text-brand-emerald'
          : 'bg-muted/60 text-muted-foreground/55',
      )}
    >
      {filledAndComplete && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
      {filledCount}/{visibleCount}
    </span>
  )
}

// ── Field-cluster helpers ────────────────────────────────────────────────
// Design-System pass: `pick`/`leftover`/`clusterGrid`/`fullWidth` existed,
// byte-for-byte identical, independently in both LocationZoningStepView.tsx
// and PricingTermsStepView.tsx — the same duplication GroupCaption had
// before it was promoted above. Promoted here for the same reason: every
// step-level body-composer function (LocationBody, ZoningBody, PricingBody,
// etc.) reads from one implementation instead of two that happened to agree
// by coincidence.

export interface ClusterContext {
  form: UseFormReturn<any>
  watchedValues: Record<string, unknown>
  fieldOptions: Record<string, FieldOption[]>
  /** True per field key while its `reload-options` dependency is in flight — see useDynamicForm.ts. */
  fieldOptionsLoading?: Record<string, boolean>
}

/** Fields matching a named key list — a presentation-only lookup into
 *  `section.fields`, never a mutation of it. */
export function pickFields(fields: FieldSchema[], keys: string[]): FieldSchema[] {
  return fields.filter(f => keys.includes(f.key))
}

/** Fields not claimed by any named cluster — the safety net a step's
 *  body-composer uses so a future schema addition can never silently
 *  disappear just because the view doesn't know about it yet. */
export function leftoverFields(fields: FieldSchema[], claimed: string[][]): FieldSchema[] {
  const used = new Set(claimed.flat())
  return fields.filter(f => !used.has(f.key))
}

/** Presentation-only override: drops a field's own schema-declared span so
 *  it always renders full-width. `span` is pure grid-layout metadata —
 *  nothing else (RHF, Zod, DependencyEngine, ValidationEngine) reads it. */
export function fullWidthField(field: FieldSchema): FieldSchema {
  return { ...field, span: undefined }
}

/** One GridEngine call for a named cluster of fields, sharing the same
 *  form/watchedValues/fieldOptions every other cluster in the same section
 *  body reads from. */
export function clusterGrid(fields: FieldSchema[], ctx: ClusterContext) {
  return (
    <GridEngine
      fields={fields}
      form={ctx.form}
      watchedValues={ctx.watchedValues}
      fieldOptions={ctx.fieldOptions}
      fieldOptionsLoading={ctx.fieldOptionsLoading}
      permissions={[]}
    />
  )
}

// ── SectionRow ────────────────────────────────────────────────────────────
// Design-System pass: the "two sections side by side once there's room"
// wrapper existed independently 3 times — Identity's
// Classification|Governance (a viewport breakpoint, `md:`), Location's
// Zoning|Proximity and Contacts|Map (container-query tiers `@2xl`/`@4xl`),
// and Pricing's Investment|Utilities (`@sm` — a fourth tier matching none of
// the other three, and not one of GridEngine's own canonical container
// tiers either — see utils.ts). Promoted here on the exact same 3 tiers
// GridEngine's own getGridClasses already uses, so a section-level row and
// a field-level span always agree on what "the container has room" means.

const ROW_2UP: Record<'sm' | 'md' | 'lg', string> = {
  sm: '@md:grid-cols-2',
  md: '@2xl:grid-cols-2',
  lg: '@4xl:grid-cols-2',
}
const ROW_SIDEBAR: Record<'sm' | 'md' | 'lg', string> = {
  sm: '@md:grid-cols-12',
  md: '@2xl:grid-cols-12',
  lg: '@4xl:grid-cols-12',
}
const SIDEBAR_NARROW: Record<'sm' | 'md' | 'lg', string> = {
  sm: '@md:col-span-4',
  md: '@2xl:col-span-4',
  lg: '@4xl:col-span-4',
}
const SIDEBAR_WIDE: Record<'sm' | 'md' | 'lg', string> = {
  sm: '@md:col-span-8',
  md: '@2xl:col-span-8',
  lg: '@4xl:col-span-8',
}

interface SectionRowProps {
  /** Matches GridEngine's own sm(@md)/md(@2xl)/lg(@4xl) container tiers —
   *  see utils.ts. */
  tier: 'sm' | 'md' | 'lg'
  /** 'equal' — two even columns. 'sidebar' — a 4:8 split (narrow first,
   *  wide second — e.g. a single control beside a rich content area). */
  variant?: 'equal' | 'sidebar'
  /** Exactly two children, in order. */
  children: ReactNode
}

export function SectionRow({ tier, variant = 'equal', children }: SectionRowProps) {
  if (variant === 'sidebar') {
    const items = Array.isArray(children) ? children : [children]
    return (
      <div className="@container">
        <div className={cn('grid grid-cols-1 items-start gap-5', ROW_SIDEBAR[tier])}>
          <div className={SIDEBAR_NARROW[tier]}>{items[0]}</div>
          <div className={SIDEBAR_WIDE[tier]}>{items[1]}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="@container">
      <div className={cn('grid grid-cols-1 items-start gap-5', ROW_2UP[tier])}>
        {children}
      </div>
    </div>
  )
}
