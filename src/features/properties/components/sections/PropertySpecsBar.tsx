import { Bed, Bath, Square, Calendar, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RealEstateProperty } from '../../types/property.types'

interface PropertySpecsBarProps {
  property:        RealEstateProperty
  onViewFullSpecs?: () => void
}

export function PropertySpecsBar({ property, onViewFullSpecs }: PropertySpecsBarProps) {
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
      {onViewFullSpecs && (
        <button
          type="button"
          onClick={onViewFullSpecs}
          className="w-full md:w-auto shrink-0 px-6 py-3 bg-foreground text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-85 transition-all shadow-md active:scale-95"
        >
          Full Specifications
        </button>
      )}

    </section>
  )
}
