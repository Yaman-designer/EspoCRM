'use client'

import { useState } from 'react'
import { Bed, Bath, Square, Calendar, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RealEstateProperty } from '../../types/property.types'

interface PropertySpecsBarProps {
  property:        RealEstateProperty
  onViewFullSpecs?: () => void
}

// Property Details Completion (2026-07-17). This prop existed before this
// change but was always passed as `undefined` (see PropertyDetailView.tsx) —
// the "Full Specifications" button never did anything. Wired up here as a
// self-contained dialog rather than plumbing new callback state through
// PropertyDetailView, so the extension stays local to this one component.
// onViewFullSpecs is kept as an optional override for a future caller that
// wants its own handling instead of the built-in dialog.
export function PropertySpecsBar({ property, onViewFullSpecs }: PropertySpecsBarProps) {
  const [fullSpecsOpen, setFullSpecsOpen] = useState(false)
  const { bedroomCount, bathroomCount, square, yearBuilt, energyClass } = property

  type SpecItem = {
    icon:      React.ComponentType<{ className?: string }>
    value:     string | number
    label:     string
    sub:       string
    emerald?:  boolean
  }

  const specs: SpecItem[] = [
    bedroomCount != null && {
      icon:  Bed,
      value: `${bedroomCount} Bedrooms`,
      label: `${bedroomCount} Bedrooms`,
      sub:   'Living Space',
    },
    bathroomCount != null && {
      icon:  Bath,
      value: `${bathroomCount} Baths`,
      label: `${bathroomCount} Baths`,
      sub:   'Sanitary',
    },
    square != null && {
      icon:  Square,
      value: `${square.toLocaleString('en-US')} m²`,
      label: `${square.toLocaleString('en-US')} m²`,
      sub:   'Interior Area',
    },
    yearBuilt != null && {
      icon:  Calendar,
      value: yearBuilt,
      label: String(yearBuilt),
      sub:   'Vintage',
    },
    energyClass ? {
      icon:    ShieldCheck,
      value:   energyClass,
      label:   energyClass,
      sub:     'Efficiency',
      emerald: true,
    } : false,
  ].filter(Boolean) as SpecItem[]

  if (specs.length === 0) return null

  return (
    // Stitch: bg-white border border-border rounded-2xl p-5 shadow-sm
    //         flex flex-col md:flex-row items-center justify-between gap-6
    //         transition-all hover:translate-y-[-2px]
    <section className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:-translate-y-0.5">

      {/* Stitch: flex items-center gap-8 lg:gap-12 overflow-x-auto no-scrollbar w-full md:w-auto */}
      <div className="flex items-center gap-8 lg:gap-12 overflow-x-auto no-scrollbar w-full md:w-auto">

        {specs.map((spec, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-4 shrink-0',
              // Stitch: first item has no border; all subsequent: border-l border-border pl-6 lg:pl-12
              i > 0 && 'border-l border-border pl-6 lg:pl-12',
            )}
          >
            {/* Stitch icon wrapper */}
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              spec.emerald
                // Stitch: bg-emerald/5 border border-emerald-100
                ? 'bg-brand-emerald/5 border border-brand-emerald/20'
                // Stitch: bg-background border border-border
                : 'bg-background border border-border',
            )}>
              <spec.icon className={cn(
                'w-5 h-5',
                // Stitch: text-text-muted (normal) / text-emerald (efficiency)
                spec.emerald ? 'text-brand-emerald' : 'text-muted-foreground',
              )} />
            </div>

            <div>
              {/* Stitch: text-sm font-black text-text-main leading-none mb-1 */}
              <div className={cn(
                'text-sm font-black leading-none mb-1',
                spec.emerald ? 'text-brand-emerald' : 'text-foreground',
              )}>
                {spec.label}
              </div>
              {/* Stitch: text-[9px] font-black text-text-muted uppercase tracking-widest */}
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                {spec.sub}
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Stitch: w-full md:w-auto shrink-0 px-6 py-3 bg-text-main text-white
                  rounded-xl text-[10px] font-black uppercase tracking-widest
                  hover:bg-navy transition-all shadow-md active:scale-95       */}
      <button
        type="button"
        onClick={onViewFullSpecs ?? (() => setFullSpecsOpen(true))}
        className="w-full md:w-auto shrink-0 px-6 py-3 bg-foreground text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-85 transition-all shadow-md active:scale-95"
      >
        Full Specifications
      </button>

      <FullSpecsDialog open={fullSpecsOpen} onOpenChange={setFullSpecsOpen} property={property} />

    </section>
  )
}

// ── Full Specifications dialog ──────────────────────────────────────────────
// Property Details Completion (2026-07-17). The Size, Rooms & Structure
// Wizard step's 16 fields with no other home in the Details page — the
// bar above is deliberately a curated top-line strip, not a full listing.

function FullSpecsDialog({
  open, onOpenChange, property,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: RealEstateProperty
}) {
  const {
    plotArea, balconyArea, facadeLength, cHalfBathrooms, livingRooms,
    additionalLivingRooms, kitchens, cMasterrooms, cLivingkitchens, parkingSpaces,
    floor, floorCount, floorKey, lastFloor, penthouse, cCondition,
  } = property

  const rows: Array<{ label: string; value: string }> = [
    plotArea              != null && { label: 'Plot Area',              value: `${plotArea.toLocaleString('en-US')} m²` },
    balconyArea           != null && { label: 'Balcony Area',           value: `${balconyArea.toLocaleString('en-US')} m²` },
    facadeLength          != null && { label: 'Facade Length',          value: String(facadeLength) },
    livingRooms           != null && { label: 'Living Rooms',           value: String(livingRooms) },
    additionalLivingRooms != null && { label: 'Additional Living Rooms', value: String(additionalLivingRooms) },
    kitchens               != null && { label: 'Kitchens',              value: String(kitchens) },
    cMasterrooms           != null && { label: 'Master Rooms',          value: String(cMasterrooms) },
    cLivingkitchens        != null && { label: 'Living Kitchens',       value: String(cLivingkitchens) },
    cHalfBathrooms          != null && { label: 'WC / Half Bathrooms',  value: String(cHalfBathrooms) },
    parkingSpaces           != null && { label: 'Parking Spaces',       value: String(parkingSpaces) },
    floor                   != null && { label: 'Floor Number',        value: String(floor) },
    floorCount              != null && { label: 'Floor Count',          value: String(floorCount) },
    floorKey                != null && { label: 'Floor Key',            value: String(floorKey) },
    lastFloor               != null && { label: 'Last Floor',           value: lastFloor ? 'Yes' : 'No' },
    penthouse                != null && { label: 'Penthouse',           value: penthouse ? 'Yes' : 'No' },
    cCondition                != null && { label: 'Condition',           value: `${cCondition} / 5` },
  ].filter((r): r is { label: string; value: string } => !!r)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Full Specifications</DialogTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 py-4">No additional specifications recorded for this listing.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 py-2">
            {rows.map(row => (
              <div key={row.label}>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</div>
                <div className="text-sm font-black text-foreground">{row.value}</div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
