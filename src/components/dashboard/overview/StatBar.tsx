import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { stats } from './data'

function StatCard({ emoji, title, value, trend, up }: (typeof stats)[0]) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-lg leading-none">
          {emoji}
        </span>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        <span
          className={cn(
            'mb-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
            up
              ? 'bg-brand-emerald-soft text-brand-emerald'
              : 'bg-brand-crimson-soft text-brand-crimson',
          )}
        >
          {trend}
          {up
            ? <ArrowUpRight className="h-3 w-3" />
            : <ArrowDownRight className="h-3 w-3" />}
        </span>
      </div>
    </Card>
  )
}

export function StatBar() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => <StatCard key={s.title} {...s} />)}
    </div>
  )
}
