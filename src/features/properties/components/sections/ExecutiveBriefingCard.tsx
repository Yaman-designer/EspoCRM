'use client'

import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BriefingViewModel } from '../../view-models/briefing.viewmodel'

interface ExecutiveBriefingCardProps {
  viewModel: BriefingViewModel
}

// IA Sprint 3 (2026-07-18). Status/Type/Code KPI strip and the Description
// text removed from this card — both duplicated information already owned
// elsewhere. Status/Type/Code are the Hero's own pills, one card above this
// one; a reader has already seen them by the time they reach this card.
// Description/cDescriptionGr moved to their own ListingDescriptionCard
// (same position in the page, immediately after this card) — a card meant
// to be a 3-second read shouldn't also carry an unbounded paragraph of
// marketing copy. See the IA Implementation Report for the full rationale.
//
// Executive Insight polish pass (2026-07-18). `narrative` is a deterministic,
// rule-based editorial generator (see property-narrative.ts's own doc
// comment — "No AI, no randomness") — not an LLM call. Nothing here claims
// otherwise: no invented "generated at" timestamp, no fabricated confidence
// score. There genuinely is no such metadata in the data model to surface,
// so none is shown. The redesign is about tone, not truth-in-labeling —
// this used to read as a left-rail alert banner (border-l-[6px], bold blue
// underlined text); now it reads as a calm, editorial insight.
//
// Editorial pass (2026-07-18). Restructured from one inline-highlighted
// paragraph into three stacked, independently scannable tiers — Category
// (the eyebrow), Insight (the lead clause, headline weight), Supporting
// context (the rest, quieter) — instead of asking the eye to parse color
// changes mid-sentence.
//
// Enterprise architecture pass (2026-07-23). Sentence-splitting and the
// narrative-absent fallback template used to live in this component; both
// moved to `buildBriefingViewModel` (view-models/briefing.viewmodel.ts).

export function ExecutiveBriefingCard({ viewModel }: ExecutiveBriefingCardProps) {
  const { t } = useTranslation('properties')
  // insight/supporting are NOT translated here — see property-narrative.ts's
  // own doc comment: a deterministic but combinatorially open-ended sentence
  // generator built from real property data, not a bounded set of UI
  // template strings. Localizing it correctly means localizing the
  // generator's own sentence-construction rules, not wrapping its output in
  // t() — flagged as a follow-up, not guessed at here.
  const { insight, supporting, requestTypeLabel } = viewModel

  return (
    <div className="bg-card rounded-2xl border border-border/40 shadow-design-xs p-[clamp(1.25rem,1.05rem+0.9vw,2rem)]">
      <div className="flex gap-[clamp(0.875rem,0.7rem+0.7vw,1.25rem)] items-start">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/6">
          <Sparkles className="size-4.5 text-primary/70" />
        </div>

        <div className="min-w-0 flex-1 max-w-[68ch]">
          {/* Category — a quiet caption, not a filled pill. Blue is
              reserved for the icon above; the label itself is neutral so
              it doesn't compete with the insight beneath it. */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em]">
              {t('briefing.eyebrow')}
            </span>
            {requestTypeLabel && (
              <>
                <span className="text-muted-foreground/25">·</span>
                <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                  {requestTypeLabel}
                </span>
              </>
            )}
          </div>

          {/* Insight — the one thing worth reading, set with headline
              weight but never oversized. */}
          <p className="text-[clamp(0.9375rem,0.88rem+0.25vw,1.0625rem)] font-semibold text-foreground leading-snug">
            {insight}
          </p>

          {/* Supporting context — quieter, only rendered when the
              narrative actually has a second clause worth showing. */}
          {supporting && (
            <p className="mt-1.5 text-[clamp(0.8125rem,0.78rem+0.2vw,0.875rem)] text-foreground/55 leading-relaxed">
              {supporting}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
