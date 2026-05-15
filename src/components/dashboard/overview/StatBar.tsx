import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stats } from './data'

function StatCard({ emoji, title, value, trend, up }: (typeof stats)[0]) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-design-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl leading-none">{emoji}</span>
        <span className={cn(
          'flex items-center gap-0.5 text-xs font-semibold',
          up ? 'text-chart-3' : 'text-destructive',
        )}>
          {trend}
          {up
            ? <ArrowUpRight   className="h-3.5 w-3.5" />
            : <ArrowDownRight className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{title}</p>
      </div>
    </div>
  )
}

export function StatBar() {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {stats.map((s) => <StatCard key={s.title} {...s} />)}
    </div>
  )
}
