'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  useActiveTooltipLabel, useIsTooltipActive,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { chartData } from './data'

const PERIODS = ['Monthly', 'Quarterly', 'Yearly'] as const

function CustomTooltip() {
  const active = useIsTooltipActive()
  const label  = useActiveTooltipLabel()
  if (!active) return null
  return (
    <div className="min-w-[160px] rounded-xl border border-border bg-card p-3.5 shadow-design-lg">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label as string}
      </p>
      <p className="mt-1.5 text-base font-bold text-foreground">$96,700,050</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Target: 120M</p>
    </div>
  )
}

export function PerformanceChart() {
  const [period, setPeriod] = useState('Monthly')

  return (
    <Card className="gap-0">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Performance</CardTitle>
            <div className="mt-1.5 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-2" /> Visit
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="shrink-0">
                {period}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PERIODS.map((p) => (
                <DropdownMenuItem
                  key={p}
                  onSelect={() => setPeriod(p)}
                  className={cn(period === p && 'font-medium text-primary')}
                >
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-2 pt-3">
        <ResponsiveContainer width="100%" height={220}>
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
      </CardContent>
    </Card>
  )
}
