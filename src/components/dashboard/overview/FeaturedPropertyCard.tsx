import { ExternalLink, Star } from 'lucide-react'
import { featuredProperty } from './data'

export function FeaturedPropertyCard() {
  const { name, type, sold, rented, views, badge } = featuredProperty

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-design-sm">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Featured Property</h3>
        <button
          aria-label="View property"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body: info left, gradient image right */}
      <div className="flex min-h-[130px] overflow-hidden">

        {/* Left — text & stats */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
              <Star className="h-3 w-3 fill-primary" />
              {badge}
            </span>
            <p className="mt-2 text-base font-bold leading-tight text-foreground">{name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{type}</p>
          </div>

          {/* Stats */}
          <div className="mt-3 flex gap-5">
            {([
              { label: 'Sold',   value: sold   },
              { label: 'Rented', value: rented },
              { label: 'Views',  value: views  },
            ] as const).map(({ label, value }) => (
              <div key={label}>
                <p className="text-sm font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — property gradient image placeholder */}
        <div className="relative w-28 shrink-0 bg-linear-to-br from-primary/40 via-chart-1/20 to-chart-4/15">
          {/* Decorative window/building silhouette */}
          <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
            {[40, 60, 50, 70].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-white/25"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
