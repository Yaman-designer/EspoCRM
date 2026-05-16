import Image from 'next/image'
import { ArrowUpRight, Star, MapPin } from 'lucide-react'
import { featuredProperty } from './data'

export function FeaturedPropertyCard() {
  const { name, type, location, sold, rented, views, badge, occupancyPct } = featuredProperty

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">

      {/* Image banner */}
      <div className="relative h-28 w-full">
        <Image
          src="/imges/e9e46baaa351f4e0a9d3968652b277d4.jpg"
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top-right action */}
        <button
          aria-label="View property"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>

        {/* Badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
            <Star className="h-2.5 w-2.5 fill-current text-yellow-400" />
            {badge}
          </span>
        </div>

        {/* Property name over image */}
        <div className="absolute inset-x-3 bottom-3">
          <p className="text-sm font-bold leading-tight text-white">{name}</p>
          <p className="flex items-center gap-1 text-[10px] text-white/80">
            <MapPin className="h-2.5 w-2.5" />
            {location}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{type}</p>

        <div className="grid grid-cols-3 gap-2">
          {([
            { label: 'Sold',   value: sold   },
            { label: 'Rented', value: rented },
            { label: 'Views',  value: views  },
          ] as const).map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-muted/30 px-2 py-2 text-center border border-border/40">
              <p className="text-[15px] font-bold tracking-tight text-foreground">{value}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Occupancy */}
        <div className="mt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">Occupancy rate</span>
            <span className="text-[10px] font-bold text-foreground">{occupancyPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
