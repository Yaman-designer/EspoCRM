import { ChevronRight, ExternalLink, Users, Loader2, Hand } from 'lucide-react'
import { cn } from '@/lib/utils'
import { reminders, type Reminder, type ReminderIcon } from './data'

const ICON_MAP: Record<ReminderIcon, React.ElementType> = {
  users:  Users,
  loader: Loader2,
  hand:   Hand,
}

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
]

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const Icon = ICON_MAP[reminder.iconType]
  const hasAvatars = reminder.avatars.length > 0

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50">

      {/* Left icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{reminder.label}</p>
        <p className="text-[11px] text-muted-foreground">{reminder.description}</p>
      </div>

      {/* Avatar stack or empty slot + chevron */}
      <div className="flex shrink-0 items-center gap-1.5">
        {hasAvatars && (
          <div className="flex -space-x-1.5">
            {reminder.avatars.map((init, i) => (
              <span
                key={i}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold',
                  AVATAR_PALETTE[i % AVATAR_PALETTE.length],
                )}
              >
                {init}
              </span>
            ))}
            {reminder.extra > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground">
                +{reminder.extra}
              </span>
            )}
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}

export function ReminderList() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-design-sm">

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Reminder</h3>
        <button
          aria-label="Open reminders"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col">
        {reminders.map((r) => (
          <ReminderRow key={r.id} reminder={r} />
        ))}
      </div>
    </div>
  )
}
