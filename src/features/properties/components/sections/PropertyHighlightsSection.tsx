import type { LifestyleBenefit } from '../../lib/property-intelligence'

interface PropertyHighlightsSectionProps {
  highlights:        string[]
  lifestyleBenefits: LifestyleBenefit[]
}

export function PropertyHighlightsSection({
  highlights,
  lifestyleBenefits,
}: PropertyHighlightsSectionProps) {
  if (highlights.length === 0 && lifestyleBenefits.length === 0) return null

  return (
    <div className="mt-8 px-1">
      {highlights.length > 0 && (
        <>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
            Property Highlights
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-16">
            {highlights.map((item, i) => (
              <div key={item} className="flex items-start gap-4 border-b border-border/10 py-4 last:border-0">
                <span className="mt-0.5 shrink-0 text-[9px] font-medium tabular-nums tracking-[0.15em] text-foreground/35">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13.5px] leading-[1.6] text-foreground/78">{item}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {lifestyleBenefits.length > 0 && (
        <div className={highlights.length > 0 ? 'mt-8 border-t border-border/10 pt-6' : ''}>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
            Lifestyle Benefits
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-16">
            {lifestyleBenefits.map((b, i) => (
              <div key={b.id} className="flex items-start gap-4 border-b border-border/10 py-4 last:border-0">
                <span className="mt-0.5 shrink-0 text-[9px] font-medium tabular-nums tracking-[0.15em] text-foreground/35">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13.5px] leading-[1.6] text-foreground/78">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
