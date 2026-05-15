'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  useActiveTooltipLabel, useIsTooltipActive,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chartData } from './data'

const PERIODS = ['Monthly', 'Quarterly', 'Yearly'] as const

function CustomTooltip() {
  const active = useIsTooltipActive()
  const label  = useActiveTooltipLabel()
  if (!active) return null
  return (
    <div className="min-w-[170px] rounded-xl border border-border bg-card p-3.5 shadow-design-lg">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label as string}</p>
      <p className="mt-1.5 text-base font-bold text-foreground">$96,700,050</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Target: 120M</p>
    </div>
  )
}

export function PerformanceChart() {
  const [period, setPeriod] = useState('Monthly')
  const [dropOpen, setDrop] = useState(false)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-design-sm">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Performance</h3>
          <div className="mt-1.5 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-chart-2" /> Visit
            </span>
          </div>
        </div>

        {/* Period dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setDrop((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {period}
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', dropOpen && 'rotate-180')} />
          </button>
          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDrop(false)} />
              <div className="absolute inset-e-0 top-[calc(100%+6px)] z-20 min-w-[120px] rounded-xl border border-border bg-popover py-1 shadow-design-md">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setDrop(false) }}
                    className={cn('flex w-full px-4 py-2 text-xs font-medium transition-colors hover:bg-muted', period === p ? 'text-primary' : 'text-foreground')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-poppins)' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-poppins)' }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 2' } as object}
          />

          {/* June active reference line */}
          <ReferenceLine
            x="Jun"
            stroke="var(--primary)"
            strokeWidth={1}
            strokeDasharray="0"
            opacity={0.25}
          />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
          />
          <Line
            type="monotone"
            dataKey="visit"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: 'var(--chart-2)', strokeWidth: 2, stroke: 'var(--card)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
