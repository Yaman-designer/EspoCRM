import { Sparkles } from 'lucide-react'
import type { PropertyNarrative } from '../../lib/property-narrative'
import type { RealEstateProperty } from '../../types/property.types'

interface ExecutiveBriefingCardProps {
  narrative:   PropertyNarrative
  property:    Pick<RealEstateProperty, 'status' | 'type' | 'locationName' | 'regionLocationName' | 'requestType' | 'propertyCode'>
  displayName: string
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

/**
 * Splits a one-or-two-sentence narrative into an "insight" line and an
 * optional "supporting context" line, breaking at the first sentence
 * boundary when one exists in a reasonable position, and at the nearest
 * word boundary otherwise — so the visual break between the two stacked
 * lines never lands mid-word.
 */
function splitInsight(text: string): [insight: string, supporting: string] {
  const periodIdx = text.indexOf('.')
  if (periodIdx > 30 && periodIdx < 140) {
    return [text.slice(0, periodIdx + 1), text.slice(periodIdx + 1).trim()]
  }
  const hardCut   = Math.min(90, text.length)
  const lastSpace = text.lastIndexOf(' ', hardCut)
  const cut       = lastSpace > 30 ? lastSpace : hardCut
  return [text.slice(0, cut), text.slice(cut).trim()]
}

export function ExecutiveBriefingCard({ narrative, property, displayName }: ExecutiveBriefingCardProps) {
  const locationLabel = property.locationName?.trim() || property.regionLocationName?.trim() || null

  const briefingText = narrative.summary
    ?? `${displayName} is a ${(property.type ?? 'property').toLowerCase()}${locationLabel ? ` in ${locationLabel}` : ''} — currently ${property.status.toLowerCase()}.`

  const [insight, supporting] = splitInsight(briefingText)

  const requestTypeLabel = property.requestType?.trim()
    ? `For ${property.requestType.trim()}`
    : null

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
              Executive Intelligence Brief
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
