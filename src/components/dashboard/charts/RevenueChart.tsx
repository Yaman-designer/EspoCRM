'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'يناير', revenue: 82000, target: 75000 },
  { month: 'فبراير', revenue: 95000, target: 80000 },
  { month: 'مارس', revenue: 88000, target: 85000 },
  { month: 'أبريل', revenue: 112000, target: 90000 },
  { month: 'مايو', revenue: 128000, target: 100000 },
  { month: 'يونيو', revenue: 119000, target: 110000 },
  { month: 'يوليو', revenue: 142500, target: 120000 },
]

function formatValue(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 shadow-design-md text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">
            {entry.name === 'revenue' ? 'الإيرادات' : 'الهدف'}:{' '}
            <span className="font-medium text-foreground">{formatValue(entry.value)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1A90FF" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#1A90FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#12B76A" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#12B76A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-poppins)' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-poppins)' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="target"
          stroke="#12B76A"
          strokeWidth={2}
          strokeDasharray="5 3"
          fill="url(#colorTarget)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1A90FF"
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          dot={{ fill: '#1A90FF', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#0061BC', strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
