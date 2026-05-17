'use client'

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock, Info, ChevronRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { reminders, type ActivityAlert, type AlertLevel } from './data'

// ── Alert level config ────────────────────────────────────────────────────────

const LEVEL_CFG: Record<AlertLevel, {
  bar: string
  icon: React.ElementType
  iconCls: string
  bg: string
}> = {
  urgent: { bar: 'bg-brand-crimson', icon: AlertTriangle, iconCls: 'text-brand-crimson', bg: 'bg-brand-crimson-soft' },
  warning: { bar: 'bg-chart-4', icon: Clock, iconCls: 'text-chart-4', bg: 'bg-chart-4/8' },
  info: { bar: 'bg-primary', icon: Info, iconCls: 'text-primary', bg: 'bg-primary/6' },
}

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
]

// ── Avatar stack ──────────────────────────────────────────────────────────────

function AvatarStack({ avatars, extra }: { avatars: string[]; extra: number }) {
  return (
    <div className="mt-1.5 flex -space-x-2">
      {avatars.map((init, i) => (
        <span
          key={i}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            'border-2 border-card text-[9px] font-bold',
            AVATAR_PALETTE[i % AVATAR_PALETTE.length],
          )}
        >
          {init}
        </span>
      ))}
      {extra > 0 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  )
}

// ── Alert row ─────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: ActivityAlert }) {
  const cfg = LEVEL_CFG[alert.level]
  const Icon = cfg.icon

  return (
    <div className="group flex gap-2.5 rounded-lg p-3 transition-colors hover:bg-muted/35">
      {/* Colored accent bar */}
      <div className={cn('mt-0.5 w-0.5 shrink-0 rounded-full self-stretch opacity-80', cfg.bar)} />

      {/* Icon */}
      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', cfg.iconCls)} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-foreground leading-snug">{alert.label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/80">{alert.description}</p>
        {alert.avatars.length > 0 && (
          <AvatarStack avatars={alert.avatars} extra={alert.extra} />
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" />
    </div>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────

export function ReminderList() {
  const { t } = useTranslation('dashboard')
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">

      <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-6 py-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{t('reminders.title')}</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('reminders.needAttention', { count: reminders.length })}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" aria-label="Open alerts" className="text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 p-3">
        {reminders.map((r) => (
          <AlertRow key={r.id} alert={r} />
        ))}
      </div>

    </div>
  )
}
