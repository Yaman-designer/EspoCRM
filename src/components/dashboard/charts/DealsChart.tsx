'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const stages = [
  { name: 'Qualified', value: 84, color: '#1A90FF' },
  { name: 'Proposal', value: 62, color: '#7BBFFF' },
  { name: 'Negotiation', value: 48, color: '#12B76A' },
  { name: 'Closed', value: 54, color: '#F79009' },
  { name: 'Lost',  value: 36, color: '#F04438' },
]

const total = stages.reduce((s, d) => s + d.value, 0)

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-design-md text-xs">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-foreground font-medium">{item.name}</span>
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {item.value} deals &middot; {Math.round((item.value / total) * 100)}%
      </p>
    </div>
  )
}

export function DealsChart() {
  return (
    <div className="flex flex-col gap-4">
      {/* Donut */}
      <div className="relative flex justify-center">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={stages}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {stages.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-foreground leading-none">{total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Deals</p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stage.color }} />
            <span className="flex-1 text-xs text-muted-foreground">{stage.name}</span>
            <span className="text-xs font-semibold text-foreground">{stage.value}</span>
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(stage.value / total) * 100}%`, background: stage.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
