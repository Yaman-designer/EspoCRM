'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { btnCls } from './styles'

interface Notification {
  id: number
  title: string
  time: string
  unread: boolean
}

const notifications: Notification[] = [
  { id: 1, title: 'New property listing added', time: '2 min ago', unread: true  },
  { id: 2, title: 'Contract #1042 signed',       time: '1 hr ago',  unread: true  },
  { id: 3, title: 'Call scheduled with client',  time: '3 hrs ago', unread: false },
]

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export function NotifDropdown({ isOpen, onToggle }: Props) {
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="Notifications"
        className={cn('relative', btnCls, isOpen && 'bg-muted text-foreground')}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 inset-e-1.5 flex h-[13px] w-[13px] items-center justify-center rounded-full bg-destructive text-[9px] font-bold leading-none text-white ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute inset-e-0 top-[calc(100%+8px)] z-20 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-design-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                    n.unread && 'bg-accent/20',
                  )}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.unread ? 'bg-primary' : 'bg-transparent')} />
                  <div>
                    <p className="text-sm leading-snug text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-4 py-2.5">
              <button className="text-xs font-medium text-primary hover:underline">
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
