'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  useActiveTooltipLabel,
  useIsTooltipActive,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { chartData } from './data'

const PERIODS = ['monthly', 'quarterly', 'yearly'] as const
type Period = typeof PERIODS[number]

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip() {
  const active = useIsTooltipActive()
  const label = useActiveTooltipLabel()
  if (!active) return null
  return (
    <div className="min-w-[152px] rounded-xl border border-border bg-card p-3.5 shadow-design-lg">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label as string}
      </p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm font-bold text-foreground">$96,700,050</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-chart-3" />
          <p className="text-xs text-muted-foreground">481 visits</p>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PerformanceChart() {
  const { t } = useTranslation('dashboard')
  const [period, setPeriod] = useState<Period>('monthly')

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md overflow-hidden">

      {/* Header */}
<div className="border-b border-border/40 bg-muted/10 px-5 py-5">

  <div className="flex flex-col gap-5">

    {/* TOP ROW */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

      {/* LEFT */}
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {t('performance.title')}
        </h3>
      </div>

      {/* RIGHT */}
      <div className="flex flex-wrap items-center gap-4 lg:gap-5 sm:justify-end">

        {/* Legend */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t('performance.revenue')}
          </span>

          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-chart-3" />
            {t('performance.visits')}
          </span>
        </div>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg px-3 text-xs"
            >
              {t(`performance.${period}`)}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {PERIODS.map((p) => (
              <DropdownMenuItem
                key={p}
                onSelect={() => setPeriod(p)}
                className={cn(
                  period === p && 'font-medium text-primary'
                )}
              >
                {t(`performance.${p}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>

    {/* KPI ROW */}
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">

      {/* Revenue */}
      <div>
        <p className="text-3xl font-bold leading-none tracking-tight text-foreground">
          $96.7M
        </p>

        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('performance.revenueYTD')}
        </p>
      </div>

      {/* Divider */}
      <div className="hidden h-10 w-px bg-border sm:block" />

      {/* Target */}
      <div>
        <p className="text-lg font-semibold leading-none text-foreground">
          $120M
        </p>

        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('performance.annualTarget')}
        </p>
      </div>

      {/* Badge */}
      <div className="inline-flex h-9 items-center rounded-full bg-brand-emerald/10 px-3.5 text-xs font-semibold text-brand-emerald">
        {t('performance.achieved', { percent: 81 })}
      </div>

    </div>

  </div>
</div>

      {/* Chart */}
      <div className="px-2 pb-3 flex-1 min-h-[168px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
              vertical={false}
              strokeOpacity={0.35}
            />

            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-poppins)' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-poppins)' }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 3', opacity: 0.4 } as object}
            />

            {/* Revenue area */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 4.5, fill: 'var(--color-primary)', strokeWidth: 2.5, stroke: 'var(--color-card)' }}
            />

            {/* Visits line */}
            <Line
              type="monotone"
              dataKey="visit"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-chart-3)', strokeWidth: 2, stroke: 'var(--color-card)' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
