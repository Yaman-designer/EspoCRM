import { cn } from '@/lib/utils'

type IconComp = React.ComponentType<{ className?: string }>

export function TimelineEvent({
  icon: Icon,
  title,
  subtitle,
  date,
  isLast = false,
  variant = 'default',
}: {
  icon:      IconComp
  title:     string
  subtitle?: string
  date?:     string
  isLast?:   boolean
  variant?:  'default' | 'primary' | 'success' | 'warning'
}) {
  const iconCls = {
    default: 'border border-border/25 bg-card text-muted-foreground/50',
    primary: 'bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,97,188,0.22)]',
    success: 'bg-emerald-500 text-white shadow-[0_2px_6px_rgba(16,185,129,0.24)]',
    warning: 'bg-amber-400 text-white shadow-[0_2px_6px_rgba(245,158,11,0.24)]',
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', iconCls[variant])}>
          <Icon className="size-3.5" />
        </div>
        {!isLast && (
          <div className="mt-1.5 min-h-7 w-px flex-1 bg-linear-to-b from-border/25 to-transparent" />
        )}
      </div>
      <div className={cn('min-w-0 pt-1', !isLast && 'pb-5')}>
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground/60">{subtitle}</p>
        )}
        {date && (
          <p className="mt-1 text-[11px] tabular-nums text-muted-foreground/45">{date}</p>
        )}
      </div>
    </div>
  )
}
