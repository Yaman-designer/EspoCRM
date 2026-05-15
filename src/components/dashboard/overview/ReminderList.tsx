'use client'

import { ChevronRight, ExternalLink } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { reminders, type Reminder } from './data'

// ── Colour map → CSS variables ────────────────────────────────────────────────

const COLOR_VAR: Record<Reminder['color'], string> = {
  'primary': 'var(--color-primary)',
  'chart-3': 'var(--color-chart-3)',
  'chart-4': 'var(--color-chart-4)',
}

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
]

// ── Avatar stack ──────────────────────────────────────────────────────────────

function AvatarStack({ avatars, extra }: { avatars: string[]; extra: number }) {
  return (
    <div className="flex -space-x-2">
      {avatars.map((init, i) => (
        <span
          key={i}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full',
            'border-2 border-card text-[9px] font-bold',
            AVATAR_PALETTE[i % AVATAR_PALETTE.length],
          )}
        >
          {init}
        </span>
      ))}
      {extra > 0 && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  )
}

// ── Mini sparkline ────────────────────────────────────────────────────────────

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((v) => ({ v }))
  const id   = `fill-${color.replace(/[^a-z0-9]/g, '')}`
  return (
    <div className="h-9 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Single row ────────────────────────────────────────────────────────────────

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const hasAvatars  = reminder.avatars.length > 0
  const strokeColor = COLOR_VAR[reminder.color]

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div
        className="h-8 w-1 shrink-0 rounded-full opacity-70"
        style={{ backgroundColor: strokeColor }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{reminder.label}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
          {reminder.description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasAvatars
          ? <AvatarStack avatars={reminder.avatars} extra={reminder.extra} />
          : <MiniSparkline values={reminder.sparkline} color={strokeColor} />
        }
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────

export function ReminderList() {
  return (
    <Card className="gap-0 p-0">

      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Reminder</h3>
        <Button variant="ghost" size="icon-xs" aria-label="Open reminders">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border/50 px-2 py-2">
        {reminders.map((r) => (
          <ReminderRow key={r.id} reminder={r} />
        ))}
      </div>

    </Card>
  )
}
