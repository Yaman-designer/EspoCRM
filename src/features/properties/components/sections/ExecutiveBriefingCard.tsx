import { Sparkles } from 'lucide-react'
import type { PropertyNarrative } from '../../lib/property-narrative'
import type { RealEstateProperty } from '../../types/property.types'

interface ExecutiveBriefingCardProps {
  narrative:   PropertyNarrative
  property:    Pick<RealEstateProperty, 'status' | 'type' | 'locationName' | 'regionLocationName' | 'purpose' | 'propertyCode'>
  displayName: string
}

export function ExecutiveBriefingCard({ narrative, property, displayName }: ExecutiveBriefingCardProps) {
  const locationLabel = property.locationName?.trim() || property.regionLocationName?.trim() || null

  const briefingText = narrative.summary
    ?? `${displayName} is a ${(property.type ?? 'property').toLowerCase()}${locationLabel ? ` in ${locationLabel}` : ''} — currently ${property.status.toLowerCase()}.`

  const periodIdx       = briefingText.indexOf('.')
  const splitAt         = periodIdx > 30 && periodIdx < 140 ? periodIdx + 1 : Math.min(90, briefingText.length)
  const highlightedPart = briefingText.slice(0, splitAt)
  const normalPart      = briefingText.slice(splitAt)

  const statusColor =
    property.status === 'Available'                                                          ? 'text-brand-emerald' :
    property.status === 'Sold' || property.status === 'Rented'                               ? 'text-brand-crimson' :
    property.status === 'Reserved' || property.status === 'Pending' ||
    property.status === 'Under Approval'                                                      ? 'text-amber-600'     :
    'text-muted-foreground'

  const purposeLabel = property.purpose?.trim()
    ? `FOR ${property.purpose.trim().toUpperCase()}`
    : null

  return (
    <div className="bg-card rounded-2xl border border-border border-l-[6px] border-l-primary p-6 shadow-sm transition-all hover:-translate-y-0.5">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

        {/* Left: icon + briefing */}
        <div className="flex gap-5 items-start max-w-2xl">
          <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/10 shadow-sm">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>

          <div>
            {/* Tags row */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-md">
                Executive Intelligence Briefing
              </span>
              {purposeLabel && (
                <span className="text-[10px] font-black text-brand-emerald uppercase tracking-widest bg-brand-emerald/5 px-2.5 py-1 rounded-md">
                  {purposeLabel}
                </span>
              )}
            </div>

            {/* Briefing quote */}
            <p className="text-foreground font-semibold text-lg leading-snug max-w-[60ch]">
              {'"'}<span className="text-primary underline decoration-primary/30 underline-offset-4 font-bold">{highlightedPart}</span>{normalPart}{'"'}
            </p>
          </div>
        </div>

        {/* Right: 3 KPI metrics — real backend fields */}
        <div className="flex gap-8 px-6 border-l border-border h-12 items-center shrink-0">
          <div className="text-center">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Status</div>
            <div className={`text-xl font-black font-heading ${statusColor}`}>{property.status}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Type</div>
            <div className="text-xl font-black text-foreground font-heading">{property.type ?? '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Code</div>
            <div className="text-xl font-black text-foreground font-heading">{property.propertyCode ?? '—'}</div>
          </div>
        </div>

      </div>
    </div>
  )
}
