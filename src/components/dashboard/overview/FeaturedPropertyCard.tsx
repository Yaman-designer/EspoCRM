import Image from 'next/image'
import { ArrowUpRight, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { featuredProperty } from './data'

export function FeaturedPropertyCard() {
  const { name, type, sold, rented, views, badge } = featuredProperty

  return (
    <Card className="flex-row gap-0 p-0">

      {/* Left: info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold leading-tight text-foreground">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{type}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {([
            { label: 'Sold',   value: sold   },
            { label: 'Rented', value: rented },
            { label: 'Views',  value: views  },
          ] as const).map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-start rounded-xl bg-secondary px-3 py-1.5"
            >
              <span className="text-sm font-bold text-foreground">{value}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: image */}
      <div className="w-32 shrink-0 p-2 pl-0">
        <div className="relative h-full overflow-hidden rounded-xl">
          <Image
            src="/imges/e9e46baaa351f4e0a9d3968652b277d4.jpg"
            alt={name}
            fill
            className="object-cover"
            sizes="128px"
          />

          <button
            aria-label="View property"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-background/90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-90"
          >
            <ArrowUpRight className="h-3 w-3 text-foreground" />
          </button>

          <div className="absolute inset-x-2 bottom-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-md">
              <CheckCircle className="h-3 w-3 shrink-0 text-brand-azure" />
              <span className="truncate text-[9px] font-semibold text-white">
                {badge}
              </span>
            </div>
          </div>
        </div>
      </div>

    </Card>
  )
}
