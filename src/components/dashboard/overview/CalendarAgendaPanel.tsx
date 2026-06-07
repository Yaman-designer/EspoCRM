'use client'

import { useSyncExternalStore } from 'react'
import { MapPin, Users, Phone, ChevronRight, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { agendaItems, type AgendaItem, type AgendaType } from './data'

function ScheduleItem({ item, isLast }: { item: AgendaItem; isLast: boolean }) {
  const { t } = useTranslation('dashboard')

  const TYPE_CFG: Record<AgendaType, {
    icon: React.ElementType
    dot: string
    labelKey: string
    labelBg: string
    labelText: string
  }> = {
    visit:    { icon: MapPin, dot: 'bg-primary', labelKey: 'schedule.visit',   labelBg: 'bg-primary/10',  labelText: 'text-primary'  },
    meeting:  { icon: Users,  dot: 'bg-chart-4', labelKey: 'schedule.meeting', labelBg: 'bg-chart-4/10',  labelText: 'text-chart-4'  },
    followup: { icon: Phone,  dot: 'bg-chart-3', labelKey: 'schedule.followup',labelBg: 'bg-chart-3/10',  labelText: 'text-chart-3'  },
  }

  const cfg  = TYPE_CFG[item.type]
  const Icon = cfg.icon

  return (
    <div className="group flex gap-3">
      <div className="w-[52px] shrink-0 pt-0.5 text-right">
        <span className="text-[10px] font-semibold leading-none text-muted-foreground">{item.time}</span>
      </div>
      <div className="flex flex-col items-center">
        <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', cfg.dot)} />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn('flex-1 pb-2.5', isLast && 'pb-0')}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-semibold leading-snug text-foreground">{item.name}</p>
          <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold', cfg.labelBg, cfg.labelText)}>
            <Icon className="h-2.5 w-2.5" />
            {t(cfg.labelKey)}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{item.detail}</p>
      </div>
    </div>
  )
}

export function CalendarAgendaPanel() {
  const { t, i18n } = useTranslation('dashboard')

  // useSyncExternalStore gives Turbopack a stable server/client split:
  // the server snapshot returns '' (avoiding a hydration mismatch with new Date()),
  // while the client snapshot computes the real locale string.
  const lang = i18n.language
  const dateLabel = useSyncExternalStore(
    () => () => {},
    () => new Date().toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', {
      weekday: 'long',
      month:   'long',
      day:     'numeric',
    }),
    () => '',
  )

  const SUMMARY_CHIPS: { type: AgendaType; count: number }[] = [
    { type: 'visit',    count: 2 },
    { type: 'meeting',  count: 1 },
    { type: 'followup', count: 1 },
  ]

  const TYPE_CHIP_CFG: Record<AgendaType, { icon: React.ElementType; labelKey: string; labelBg: string; labelText: string }> = {
    visit:    { icon: MapPin, labelKey: 'schedule.visit',    labelBg: 'bg-primary/10', labelText: 'text-primary'  },
    meeting:  { icon: Users,  labelKey: 'schedule.meeting',  labelBg: 'bg-chart-4/10', labelText: 'text-chart-4'  },
    followup: { icon: Phone,  labelKey: 'schedule.followup', labelBg: 'bg-chart-3/10', labelText: 'text-chart-3'  },
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-6 py-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{t('schedule.title')}</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{dateLabel}</p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-wide text-primary transition-colors hover:bg-primary/20"
          aria-label="Open full calendar"
        >
          <Calendar className="h-3 w-3" />
          {t('schedule.calendar')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/40 bg-muted/5 px-6 py-3">
        {SUMMARY_CHIPS.map(({ type, count }) => {
          const cfg = TYPE_CHIP_CFG[type]
          return (
            <span key={type} className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide', cfg.labelBg, cfg.labelText)}>
              <cfg.icon className="h-3 w-3" />
              {count} {t(cfg.labelKey)}{count > 1 ? 's' : ''}
            </span>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {agendaItems.map((item, i) => (
          <ScheduleItem key={item.id} item={item} isLast={i === agendaItems.length - 1} />
        ))}
      </div>

      <div className="border-t border-border/50 px-4 py-2.5">
        <button className="flex w-full items-center justify-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80">
          {t('schedule.viewFull')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
