'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import {
  SectionRenderer,
  GroupCaption,
  SectionRow,
  pickFields,
  leftoverFields,
  fullWidthField,
  clusterGrid,
  type ClusterContext,
  type StepSchema,
  type FieldSchema,
  type FieldOption,
} from '@/framework/form-engine'
import { DynamicFormContext } from '@/framework/form-engine/DynamicForm'
import { useDependencyEngine } from '@/framework/form-engine/useDynamicForm'

// Presentation-only redesign of Step 3 (Pricing & Terms) — Design-System
// Consistency Pass. Renders the exact same StepSchema (same fields,
// validation, dependencies, visibility, cross-step visibleWhen rules)
// through the same SectionRenderer/GridEngine/DynamicFormContext/
// dependency-engine wiring as every other step. Nothing here reads or
// writes anything pricing-terms.schema.ts doesn't already declare.
//
// Fourth pass on this file. The third pass ("The Pricing Desk") split the
// step into a sticky left rail plus a flowing right column, held for the
// step's entire height. That solved hierarchy but broke consistency: Step 1
// and Step 2 never split the page into two independently-scrolling zones,
// never use `position: sticky` inside a step's body, and never make the
// user choose which side to read first — a wizard step is always one
// reading flow, occasionally widening into a *bounded* 2-up row (Step 1's
// Classification | Governance, Step 2's Zoning | Proximity) that starts and
// ends within a single card, never a persistent parallel column. A sticky
// rail is a dashboard/workspace device; this wizard has none anywhere else,
// so introducing one here read as a different product, not a different
// step of the same one.
//
// This pass reverts to a single vertical sequence of exactly two
// `SectionRenderer` cards — the same count the schema itself already
// declares (`pricing`, `negotiation`) and the same literal component every
// other step's cards render through, not a lookalike. Consistency comes
// from reusing the real thing, not from copying its visual style by hand:
//
//   - Public Pricing renders through `SectionRenderer`'s default (Path C)
//     white elevated card — identical chrome to Step 1/2's own default
//     sections. Its body (`PricingBody`) is one continuous flow: Asking
//     Price large and alone at the top (the one hierarchy device worth
//     keeping — the schema's own `.required().full()` already asks for
//     this field to dominate), then a "Comparison" cluster (Initial Price /
//     Objective Value / VAT, adjacent with no divider between Objective
//     Value and VAT — the VAT tooltip's tax-basis claim on Objective Value
//     is now something the eye can verify by looking), then a "Financial
//     Characteristics" cluster (Investment | Utilities, a bounded 2-up
//     sub-row exactly like Step 1/2's own peer rows — never its own nested
//     card, which would be the "box inside a box" mistake an earlier pass
//     on this file already made and corrected once). Clusters are separated
//     by a caption + hairline divider — the exact device Step 2's own
//     LocationBody/ZoningBody already use for their internal sub-groups,
//     reused verbatim rather than invented again.
//   - Internal Negotiation renders through the same `SectionRenderer`, using
//     its built-in `background: 'muted'` variant (a real, already-existing
//     code path in SectionRenderer.tsx, not new markup) instead of a
//     bespoke tint or a left-rule callout. `collapsible` is overridden to
//     `false` at the view layer only — the negotiation floor is core data
//     an agent needs immediately, not something that earns being hidden
//     behind a click, a decision made (and left unchanged) two passes ago.
//     Its body (`NegotiationBody`) echoes the same pattern: Lower Price
//     Limit large at the top (smaller than Asking Price — a rhyme, not a
//     repeat) with a computed "X% below asking" caption (pure display
//     arithmetic over two already-watched values; nothing persisted,
//     nothing validated, nothing this schema doesn't already expose), then
//     Exchange Scheme + Percentage, then Compensation — the same
//     caption-and-divider clustering as the section above it.
//
// No per-field icons, no extra "Internal Only" badge: Step 1/2 never
// decorate a field or sub-cluster with its own icon, and the negotiation
// section's own existing description ("Internal financial levers, never
// shown to a buyer.") already states the confidentiality fact in the same
// plain prose Step 1/2 rely on everywhere else — adding a badge on top of
// it would be saying the same thing twice through two different devices.
//
// `exchangeSchemePercentage` is deliberately NOT wrapped in a conditional
// reveal here, even though it sits next to its own toggle. The schema's own
// comment on that field documents that live EspoCRM has no Dynamic Logic
// entry for it at all — a client-invented visibility gate was tried and
// removed for this exact field because it didn't match live behavior — so
// it stays unconditionally rendered, exactly as it does today.

interface PricingTermsStepViewProps {
  schema: StepSchema
  form: UseFormReturn<Record<string, unknown>>
}

type TFunc = (key: string, options?: Record<string, unknown>) => string

/** Pure display arithmetic — never persisted, never validated, purely a
 *  caption under Lower Price Limit. Returns null (render nothing) unless
 *  both values are real, positive numbers and the floor is genuinely below
 *  asking — anything else (blank fields, a floor at/above asking) has no
 *  sensible "X% below asking" sentence to show. */
function computeFloorDiscountPercent(price: unknown, floor: unknown): number | null {
  const p = typeof price === 'number' ? price : Number(price)
  const f = typeof floor === 'number' ? floor : Number(floor)
  if (!Number.isFinite(p) || !Number.isFinite(f) || p <= 0 || f <= 0 || f >= p) return null
  return Math.round((1 - f / p) * 100)
}

/* ── Toggle + its own reveal, stacked in one grid cell — same device Step
   1/2 use wherever a switch conditionally reveals a detail field, so the
   reveal always lands directly beneath its own switch regardless of the
   other column's state. ────────────────────────────────────────────────── */

function ToggleColumn({ toggle, reveal, ctx }: { toggle: FieldSchema; reveal?: FieldSchema; ctx: ClusterContext }) {
  return (
    <div className="space-y-3">
      {clusterGrid([fullWidthField(toggle)], ctx)}
      {reveal && clusterGrid([fullWidthField(reveal)], ctx)}
    </div>
  )
}

/* ── Public Pricing body: Asking Price → Comparison → Characteristics ──── */

const HERO_KEYS = ['price']
const COMPARISON_KEYS = ['initialPrice', 'objectiveValue', 'vat']
const INVESTMENT_KEYS = ['investment', 'cRentalprice']
const UTILITIES_KEYS = ['withinMonthlyUtilities', 'cAverageMonthlyUtilities']

function PricingBody(fields: FieldSchema[], ctx: ClusterContext, t: TFunc) {
  const price = pickFields(fields, HERO_KEYS)
  const comparison = pickFields(fields, COMPARISON_KEYS)
  const byKey = new Map(fields.map(f => [f.key, f]))
  const investment = byKey.get('investment')
  const utilities = byKey.get('withinMonthlyUtilities')
  const rest = leftoverFields(fields, [HERO_KEYS, COMPARISON_KEYS, INVESTMENT_KEYS, UTILITIES_KEYS])

  return (
    <div className="space-y-6">
      {/* Visual QA (F-05): Asking Price previously rendered through a
          bespoke "BigFigure" wrapper (~2× the type size of every other
          field in the wizard) — the only field anywhere in the 8 steps with
          that treatment. Renders through the same clusterGrid every other
          field uses, for consistency with Steps 1/2 and the rest of this
          step. */}
      {price.length > 0 && clusterGrid(price, ctx)}

      {/* No span override: initialPrice/objectiveValue are already .half()
          and vat is already .full() in the schema, which puts VAT directly
          beneath Objective Value with no divider between them — the
          adjacency the VAT tooltip needs. */}
      {comparison.length > 0 && (
        <div className="border-t border-border/15 pt-6">
          <GroupCaption text={t('wizard.steps.pricingTerms.sections.pricing.groups.comparison')} />
          {clusterGrid(comparison, ctx)}
        </div>
      )}

      {(investment || utilities) && (
        <div className="border-t border-border/15 pt-6">
          <GroupCaption text={t('wizard.steps.pricingTerms.sections.pricing.groups.characteristics')} />
          {/* SectionRow tier="sm" (@md, ~448px container) — the narrowest of
              the system's 3 canonical tiers, replacing an ad hoc `@sm`
              breakpoint that matched none of them. */}
          <SectionRow tier="sm">
            {investment && (
              <ToggleColumn toggle={investment} reveal={byKey.get('cRentalprice')} ctx={ctx} />
            )}
            {utilities && (
              <ToggleColumn toggle={utilities} reveal={byKey.get('cAverageMonthlyUtilities')} ctx={ctx} />
            )}
          </SectionRow>
        </div>
      )}

      {rest.length > 0 && clusterGrid(rest, ctx)}
    </div>
  )
}

/* ── Internal Negotiation body: Floor → Exchange Scheme → Compensation ── */

const FLOOR_KEYS = ['lowerPriceLimit']
const EXCHANGE_KEYS = ['exchangeScheme', 'exchangeSchemePercentage']
const COMPENSATION_KEYS = ['cRemuneration', 'cCompensationFactor']

function NegotiationBody(fields: FieldSchema[], ctx: ClusterContext, t: TFunc) {
  const floor = pickFields(fields, FLOOR_KEYS)
  const exchange = pickFields(fields, EXCHANGE_KEYS)
  const compensation = pickFields(fields, COMPENSATION_KEYS)
  const rest = leftoverFields(fields, [FLOOR_KEYS, EXCHANGE_KEYS, COMPENSATION_KEYS])

  const discountPercent = computeFloorDiscountPercent(ctx.watchedValues.price, ctx.watchedValues.lowerPriceLimit)
  const floorHasValue = ctx.watchedValues.lowerPriceLimit !== undefined
    && ctx.watchedValues.lowerPriceLimit !== null
    && ctx.watchedValues.lowerPriceLimit !== ''

  return (
    <div className="space-y-6">
      {floor.length > 0 && (
        <div>
          {clusterGrid(floor, ctx)}
          {discountPercent !== null ? (
            <p className="mt-2 text-[12px] font-medium text-muted-foreground/70">
              {t('wizard.steps.pricingTerms.sections.negotiation.floorBelowAsking', { percent: discountPercent })}
            </p>
          ) : floorHasValue ? (
            <p className="mt-2 text-[12px] text-muted-foreground/50">
              {t('wizard.steps.pricingTerms.sections.negotiation.floorNeedsPrice')}
            </p>
          ) : null}
        </div>
      )}

      {exchange.length > 0 && (
        <div className="border-t border-border/15 pt-6">{clusterGrid(exchange, ctx)}</div>
      )}

      {compensation.length > 0 && (
        <div className="border-t border-border/15 pt-6">
          <GroupCaption text={t('wizard.steps.pricingTerms.sections.negotiation.groups.compensation')} />
          {/* Composition pass: cCompensationFactor is only visible when
              cConsideration is true, so cRemuneration is often alone here —
              same stacked-full-width treatment ToggleColumn uses elsewhere
              in this file, so neither field is ever a lone .half() control
              with dead space beside it. */}
          {clusterGrid(compensation.map(fullWidthField), ctx)}
        </div>
      )}

      {rest.length > 0 && clusterGrid(rest, ctx)}
    </div>
  )
}

/* ─── PricingTermsStepView ───────────────────────────────────────────── */

const KNOWN_SECTION_IDS = ['pricing', 'negotiation']

export function PricingTermsStepView({ schema, form }: PricingTermsStepViewProps) {
  const { t } = useTranslation('properties')
  const [fieldOptions, setFieldOptionsState] = useState<Record<string, FieldOption[]>>({})
  const setFieldOptions = useCallback((key: string, options: FieldOption[]) => {
    setFieldOptionsState(prev => ({ ...prev, [key]: options }))
  }, [])

  const [fieldOptionsLoading, setFieldOptionsLoadingState] = useState<Record<string, boolean>>({})
  const setFieldOptionsLoading = useCallback((key: string, loading: boolean) => {
    setFieldOptionsLoadingState(prev => ({ ...prev, [key]: loading }))
  }, [])

  const watchedValues = useWatch({ control: form.control }) as Record<string, unknown>
  useDependencyEngine(schema, form, setFieldOptions, setFieldOptionsLoading)

  const sections = schema.sections ?? []
  const pricing = sections.find(s => s.id === 'pricing')
  const negotiation = sections.find(s => s.id === 'negotiation')
  // Any section this view doesn't know about yet — rendered generically so
  // a future schema addition is never silently dropped.
  const extraSections = sections.filter(s => !KNOWN_SECTION_IDS.includes(s.id))

  const ctx: ClusterContext = { form, watchedValues, fieldOptions, fieldOptionsLoading }

  return (
    <DynamicFormContext.Provider value={{ permissions: [], fieldOptions, setFieldOptions, fieldOptionsLoading, setFieldOptionsLoading }}>
      <div className="space-y-5 sm:space-y-6">
        {pricing && (
          <SectionRenderer
            section={pricing}
            sectionIndex={0}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
            renderBody={fields => PricingBody(fields, ctx, t)}
          />
        )}

        {negotiation && (
          <SectionRenderer
            // Presentation-only override, same technique as fullWidthField()
            // above: `collapsible: false` keeps the negotiation floor
            // always visible (a decision made two passes ago and
            // unchanged here — this is core data, not a "secondary"
            // section that earns being hidden behind a click).
            // `background: 'muted'` uses SectionRenderer's own existing
            // tinted-card code path — the one real register change on the
            // page (public -> internal) communicated with a device the
            // shared component already provides, not new markup.
            section={{ ...negotiation, collapsible: false, background: 'muted' }}
            sectionIndex={1}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
            renderBody={fields => NegotiationBody(fields, ctx, t)}
          />
        )}

        {extraSections.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            sectionIndex={2 + i}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
          />
        ))}
      </div>
    </DynamicFormContext.Provider>
  )
}
