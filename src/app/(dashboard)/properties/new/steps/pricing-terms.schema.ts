import { CircleDollarSign, Handshake } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema } from '@/framework/form-engine'
import {
  INVESTMENT_TRUE, WITHIN_MONTHLY_UTILITIES_TRUE, CCONSIDERATION_TRUE,
} from '@/features/properties/domain/visibility'

// ── Step 3: Pricing & Financial Terms ───────────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 6. 7 fields: 5 native to
// financial.schema.ts's Pricing section (migrated verbatim), plus
// investment/withinMonthlyUtilities arriving from identity.schema.ts —
// relocated to sit directly beside the reveal fields they trigger
// (cRentalprice/cAverageMonthlyUtilities), the clearest "toggle beside its
// reveal" fix in the whole spec. This fully drains financial.schema.ts's
// Pricing section; its Listing Quality section (4 badges) is Phase 6 scope
// too, migrated separately into marketing-media.schema.ts.

const S = 'wizard.steps.pricingTerms.sections'

export const pricingTermsSchema: StepSchema = {
  sections: [
    section({ id: 'pricing', titleKey: `${S}.pricing.title`, icon: CircleDollarSign }).fields([
      // Wave 4 (2026-07-14, Pricing Reconciliation): migrated from
      // field.number().prefix('$') — a pre-existing comment in this file
      // already flagged this as "a separate, un-fixed finding" alongside
      // the initialPrice/objectiveValue/lowerPriceLimit fix below. Live
      // entityDefs confirms `price` is required:true, type currency — same
      // widget and EUR currency code as its siblings.
      // Enterprise Phase 3.2, Finding D (resolved: keep, document). Live
      // entityDefs declares no minimum at all for `price` — a €0 (or
      // negative) value would pass server-side validation. min(1) kept
      // intentionally, same reasoning as `square`'s min(1) (Finding C):
      // this application has no "price on request" convention that a €0
      // asking price would represent, so a €0 listing is a data-entry
      // mistake this guard catches, not a valid state the server permits
      // that we're wrongly blocking.
      field.currency('price', `${S}.pricing.fields.price.label`)
        .required().full()
        .currencyCode('EUR').min(1)
        .build(),
      // Relocated from identity.schema.ts — now sits directly above its own
      // reveal (cRentalprice), no longer 3 steps away. No dynamic logic on
      // this field itself.
      field.switch('investment', `${S}.pricing.fields.investment.label`)
        .half()
        .build(),
      // PDF types this field "Integer" (not Currency) — plain number input,
      // no min/max/default invented. Visible only when Investment = true.
      field.number('cRentalprice', `${S}.pricing.fields.cRentalprice.label`)
        .half()
        .visibleWhen(INVESTMENT_TRUE)
        .build(),
      // Relocated from identity.schema.ts — now sits directly above its own
      // reveal (cAverageMonthlyUtilities).
      field.switch('withinMonthlyUtilities', `${S}.pricing.fields.withinMonthlyUtilities.label`)
        .half()
        .build(),
      // PDF types this field "Integer" — plain number input, no
      // min/max/default invented. Visible only when Within Monthly
      // Utilities = true. Field's canonical PDF/entityDefs name is Greek
      // ("Μέσα μηνιαία κοινόχρηστα") — preserved verbatim in the el locale,
      // with a plain English gloss in en.
      field.number('cAverageMonthlyUtilities', `${S}.pricing.fields.cAverageMonthlyUtilities.label`)
        .half()
        .visibleWhen(WITHIN_MONTHLY_UTILITIES_TRUE)
        .build(),
      // Financial business group, added 2026-07-12. All 3 fields below are
      // PDF-documented (Currency/Currency/Boolean respectively) and were
      // never built in any prior phase — none carry a Dynamic Logic rule
      // (confirmed against the live export, always visible). initialPrice/
      // objectiveValue are PDF-confirmed Currency, no min/max. vat resolves
      // the hardest item in the Missing Metadata Register (Group 5): the
      // PDF documents this field in full (including the 24%/3.09% tax
      // explanation below) but never gives it a Name= — live EspoCRM
      // entityDefs confirms the real attribute is literally `vat`.
      // currencyCode: 'EUR', not 'USD' — live-verified this session
      // (PATCH with a USD companion returns a validCurrency 400; EUR
      // succeeds). See property-form.transform.ts's Currency-companion
      // comment for the payload-level half of this fix.
      field.currency('initialPrice', `${S}.pricing.fields.initialPrice.label`)
        .half()
        .currencyCode('EUR')
        .build(),
      // Referenced by the VAT tooltip below as the transfer-tax basis.
      field.currency('objectiveValue', `${S}.pricing.fields.objectiveValue.label`)
        .half()
        .currencyCode('EUR')
        .build(),
      field.switch('vat', `${S}.pricing.fields.vat.label`)
        .full()
        .tooltip(`${S}.pricing.fields.vat.tooltip`)
        .build(),
    ]),

    section({
      id: 'negotiation',
      titleKey: `${S}.negotiation.title`,
      descriptionKey: `${S}.negotiation.description`,
      icon: Handshake,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      // Negotiation floor — optional, no validation defined in the PDF.
      // currencyCode corrected 'USD' -> 'EUR' 2026-07-12, discovered while
      // implementing the Financial group — see initialPrice's comment
      // above for the live evidence. Pre-existing field, fixed alongside
      // the two new ones since all three share the identical field.currency()
      // widget and bug class. `price` shared this exact bug class too
      // (field.number() with a manual '$' prefix, not this widget) —
      // migrated to the same field.currency() widget in Wave 4 (2026-07-14).
      // Composition pass: rendered alone at the top of NegotiationBody
      // (PricingTermsStepView.tsx) as a deliberate visual "rhyme" with
      // Asking Price — .full() (matching `price`'s own span above) removes
      // the dead half-row space a lone .half() field would leave; before
      // this it contradicted its own stated intent.
      field.currency('lowerPriceLimit', `${S}.negotiation.fields.lowerPriceLimit.label`)
        .full()
        .currencyCode('EUR')
        .build(),
      // Wave 4 (2026-07-14, Pricing Reconciliation): real Dynamic Logic
      // boolean gate for exchangeSchemePercentage below — the detail field
      // already existed (added 2026-07-12), the gate itself did not. Same
      // "toggle beside its reveal" placement as investment/withinMonthlyUtilities.
      field.switch('exchangeScheme', `${S}.negotiation.fields.exchangeScheme.label`)
        .half()
        .build(),
      // Enterprise Phase 3.2, Finding 2 (resolved: always visible, matching
      // live). Exhaustively confirmed against all 46 live Dynamic Logic
      // rules (Phase 3.1) that exchangeSchemePercentage has no entry at
      // all — unlike every sibling toggle-reveals-detail pair in this
      // entity (investment/cRentalprice, withinMonthlyUtilities/
      // cAverageMonthlyUtilities, cConsideration/cCompensationFactor, all of
      // which DO have a real live visibility rule). EspoCRM's Dynamic Logic
      // engine only conditionally shows/hides a field that has an entry in
      // dynamicLogic.fields; a field with no entry follows its layout
      // placement unconditionally. A visibleWhen gate invented client-side
      // for this field therefore does not match live behavior — removed.
      // Minimum 0 only; no maximum invented.
      field.number('exchangeSchemePercentage', `${S}.negotiation.fields.exchangeSchemePercentage.label`)
        .half().min(0)
        .helperText(`${S}.negotiation.fields.exchangeSchemePercentage.helperText`)
        .build(),
      // Financial business group, added 2026-07-12. PDF: "Αμοιβή (σε € ή %)"
      // — Integer, and the PDF's own authors flag that one Integer field
      // can't cleanly hold both a € amount and a %; not resolved here,
      // preserved as documented. Live entityDefs confirms Integer, no
      // min/max. Placed in Negotiation (not the main Pricing section) since
      // it is agent-commission-facing, matching this section's existing
      // "internal financial levers" framing.
      // Field's canonical PDF/entityDefs name is Greek ("Αμοιβή (σε € ή %)")
      // — preserved verbatim in the el locale, English gloss in en.
      field.number('cRemuneration', `${S}.negotiation.fields.cRemuneration.label`)
        .half()
        .build(),
      // Wave 4 (2026-07-14, Pricing Reconciliation): real Dynamic Logic gate
      // is `cConsideration == true` — cConsideration itself lives in the
      // Identity & Governance step (a plain switch with no prior target
      // field, per the Gate 1→2 Impact Analysis) and is consumed here
      // cross-step, the same pattern NOT_LAND_CATEGORY already establishes
      // for `category`. Live entityDefs: Integer, no min/max.
      field.number('cCompensationFactor', `${S}.negotiation.fields.cCompensationFactor.label`)
        .half()
        .visibleWhen(CCONSIDERATION_TRUE).clearWhenHidden()
        .build(),
    ]),
  ],
}
