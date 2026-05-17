'use client'

import { useTranslation } from 'react-i18next'
import {
  DollarSign,
  Users,
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { stats, type Stat, type StatColor } from './data'

const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  Users,
  Building2,
  CheckCircle2,
  Bell,
}

const COLOR_MAP: Record<StatColor, { icon: string; ring: string }> = {
  primary: { icon: 'bg-primary/10 text-primary',     ring: 'bg-primary/8'    },
  emerald: { icon: 'bg-chart-3/10 text-chart-3',     ring: 'bg-chart-3/8'    },
  amber:   { icon: 'bg-chart-4/10 text-chart-4',     ring: 'bg-chart-4/8'    },
  teal:    { icon: 'bg-brand-teal/10 text-brand-teal', ring: 'bg-brand-teal/8' },
}

// Maps data.ts title → dashboard.stats translation key
const STAT_KEY_MAP: Record<string, string> = {
  'Active Leads':   'activeLeads',
  'Total Revenue':  'totalRevenue',
  'Active Listing': 'activeListing',
  'Total Closed':   'totalClosed',
  'Reminder':       'reminder',
}

function KpiCell({ iconName, title, value, trend, up, color }: Stat) {
  const { t } = useTranslation('dashboard')
  const Icon    = ICON_MAP[iconName] ?? Building2
  const palette = COLOR_MAP[color]
  const label   = t(`stats.${STAT_KEY_MAP[title] ?? title}`)

  return (
    <div className="group flex flex-col gap-3 px-6 py-5 transition-all hover:bg-muted/30">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 shadow-sm', palette.icon, palette.ring)}>
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide',
            up ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-crimson/10 text-brand-crimson',
          )}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold leading-none tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function StatBar() {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-design-sm card-hover">
      <div className="grid grid-cols-2 divide-x divide-y divide-border/50 lg:grid-cols-5 lg:divide-y-0">
        {stats.map((s) => (
          <KpiCell key={s.title} {...s} />
        ))}
      </div>
    </div>
  )
}
