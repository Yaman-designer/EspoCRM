'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Drawer } from 'vaul'
import {
  Bell, Check, ChevronRight, Clock, RefreshCw, BellOff,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { btnCls } from './styles'
import {
  fetchNotifications,
  markAllRead,
} from '@/api/espocrm/notificationService'
import type { EspoNotification } from '@/api/espocrm/notificationService'
import {
  ENTITY_CONFIG,
  getInitials,
  getAvatarColor,
  formatDisplayTime,
  groupNotifications,
  buildMessage,
} from '@/lib/notificationUtils'
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UI Primitives
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NotifAvatar({ name, showDot }: { name: string; showDot: boolean }) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold tracking-wide text-white',
          getAvatarColor(name),
        )}
      >
        {getInitials(name)}
      </div>
      {showDot && (
        <span className="absolute -top-px -right-px h-2.5 w-2.5 rounded-full border-2 border-popover bg-primary animate-pulse" />
      )}
    </div>
  )
}

function NotifCard({ n }: { n: EspoNotification }) {
  const { t } = useTranslation('notifications')
  const isUnread = !n.read
  const msg = buildMessage(n, t)
  const entityCfg = ENTITY_CONFIG[n.noteData.parentType ?? '']
  const EntityIcon = entityCfg?.icon

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer overflow-hidden rounded-xl border',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-px hover:shadow-design-sm',
        isUnread
          ? 'border-primary/[0.18] bg-primary/[0.03] hover:bg-primary/[0.05]'
          : 'border-border/40 bg-card hover:border-border/60',
      )}
    >
      {/* Left accent bar for unread */}
      {isUnread && (
        <div className="absolute left-0 inset-y-0 w-[3px] rounded-e-full bg-primary/80" />
      )}

      <div className={cn('flex flex-1 items-start gap-3 p-3.5', isUnread && 'pl-4')}>

        <NotifAvatar name={n.noteData.createdByName ?? 'System'} showDot={isUnread} />

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-[3px]">

          {/* Message */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 leading-snug">
            {EntityIcon && entityCfg && (
              <span
                className={cn(
                  'mr-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px]',
                  entityCfg.bg,
                )}
              >
                <EntityIcon className={cn('h-2.5 w-2.5', entityCfg.fg)} />
              </span>
            )}
            <span className="text-[12.5px] font-semibold text-foreground">{msg.actor}</span>
            <span className="text-[12px] text-muted-foreground">{msg.prefix}</span>
            {msg.parent && (
              <span className="text-[12px] font-medium text-primary">{msg.parent}</span>
            )}
            {msg.suffix && (
              <span className="text-[12px] text-muted-foreground">{msg.suffix}</span>
            )}
              {/* Assigned user name — shown inline when API returns it */}
            {msg.assignedTo && (
              <span className="text-[12px] font-semibold text-foreground">{msg.assignedTo}</span>
            )}
          </div>

          {/* Post text */}
          {n.noteData.post && (
            <p className="truncate text-[11.5px] leading-tight text-muted-foreground/75">
              {n.noteData.post}
            </p>
          )}

          {/* Status badge */}
          {n.noteData.data?.statusValue && (
            <span className="inline-flex items-center rounded-md border border-blue-200/80 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-600">
              {n.noteData.data.statusValue}
            </span>
          )}

          {/* Time */}
          <div className="flex items-center gap-1 pt-0.5 text-[10.5px] text-muted-foreground/55">
            <Clock className="h-2.5 w-2.5 shrink-0" />
            {formatDisplayTime(n.createdAt)}
          </div>
        </div>


      </div>
    </div>
  )
}

function NotifGroupSection({ groupKey, items }: { groupKey: 'today' | 'yesterday' | 'earlier'; items: EspoNotification[] }) {
  const { t } = useTranslation('notifications')
  return (
    <div>
      <div className="flex items-center gap-2.5 px-0.5 py-2">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45">
          {t(groupKey)}
        </span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
      <div className="space-y-2">
        {items.map((n) => <NotifCard key={n.id} n={n} />)}
      </div>
    </div>
  )
}

function NotifEmptyState() {
  const { t } = useTranslation('notifications')
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <BellOff className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-foreground/70">{t('allCaughtUp')}</p>
        <p className="text-[11px] text-muted-foreground/50">{t('noNew')}</p>
      </div>
    </div>
  )
}

function NotifErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('notifications')
  return (
    <div className="flex flex-col items-center gap-2.5 py-10 text-center">
      <p className="text-[12px] text-muted-foreground">{t('loadFailed')}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
      >
        <RefreshCw className="h-3 w-3" /> {t('tryAgain')}
      </button>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Panel Header (sticky, shared between mobile/desktop)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface HeaderProps {
  total: number
  unread: number
  onMarkAllRead: () => void
  onViewAll: () => void
}

function NotifHeader({ total, unread, onMarkAllRead, onViewAll }: HeaderProps) {
  const { t } = useTranslation('notifications')
  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-popover/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/12 to-primary/5">
          <Bell className="h-[16px] w-[16px] text-primary" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
              {unread}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-semibold tracking-tight text-foreground">{t('title')}</h2>
            {total > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[9px] font-bold text-muted-foreground">
                {total}
              </span>
            )}
          </div>
          <p className="text-[10.5px] leading-none text-muted-foreground/60">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Check className="h-3 w-3" />
          {t('markRead')}
        </button>
        <Link
          href="/notifications"
          onClick={onViewAll}
          className="flex items-center gap-0.5 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('viewAll')}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Panel Body (shared between mobile/desktop)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface BodyProps {
  loading: boolean
  loadingMore: boolean
  error: string | null
  groups: { key: 'today' | 'yesterday' | 'earlier'; items: EspoNotification[] }[]
  hasMore: boolean
  total: number
  onRetry: () => void
  onLoadMore: () => void
}

function NotifBody({ loading, loadingMore, error, groups, hasMore, total, onRetry, onLoadMore }: BodyProps) {
  const { t } = useTranslation('notifications')
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      {loading ? (
        <NotifSkeleton />
      ) : error ? (
        <NotifErrorState onRetry={onRetry} />
      ) : total === 0 ? (
        <NotifEmptyState />
      ) : (
        <div className="space-y-1 p-3 pb-1">
          {groups.map(({ key, items }) => (
            <NotifGroupSection key={key} groupKey={key} items={items} />
          ))}
        </div>
      )}

      {!loading && hasMore && total > 0 && (
        <div className="border-t border-border/40 px-3 py-2.5">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            {loadingMore
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            }
            {loadingMore ? t('loading') : t('showMore')}
          </button>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Skeleton
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NotifSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[72, 56, 64].map((w, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border/30 bg-card p-3.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="h-[18px] w-[18px] animate-pulse rounded-[5px] bg-muted" />
              <div className={`h-3 animate-pulse rounded-md bg-muted`} style={{ width: `${w}%` }} />
            </div>
            <div className="h-2.5 w-2/5 animate-pulse rounded-md bg-muted" />
            <div className="h-2 w-1/4 animate-pulse rounded-md bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bell trigger button
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BellButton({ isOpen, unreadCount, onClick }: { isOpen: boolean; unreadCount: number; onClick: () => void }) {
  const { t } = useTranslation('notifications')
  return (
    <button
      onClick={onClick}
      aria-label={t('title')}
      className={cn(btnCls, isOpen && 'bg-muted text-foreground')}
    >
      <div className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex min-w-[14px] h-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main export
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Props {
  isOpen: boolean
  onToggle: () => void
}

const PAGE_SIZE = 5

export function NotifDropdown({ isOpen, onToggle }: Props) {
  const { t } = useTranslation('notifications')
  const isMobile = useIsMobile()

  const [notifications, setNotifications] = useState<EspoNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const groups = groupNotifications(notifications)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNotifications(PAGE_SIZE, 0)
      setNotifications(data.list)
      setHasMore(data.list.length === PAGE_SIZE)
    } catch (err) {
      console.error('[NotifDropdown] Failed to load notifications:', err)
      setError(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (isOpen && !fetchedRef.current) {
      fetchedRef.current = true
      loadInitial()
    }
  }, [isOpen, loadInitial])

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const data = await fetchNotifications(PAGE_SIZE, notifications.length)
      setNotifications((prev) => [...prev, ...data.list])
      setHasMore(data.list.length === PAGE_SIZE)
    } catch (err) {
      console.error('[NotifDropdown] Failed to load more notifications:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('[NotifDropdown] Failed to mark all as read:', err)
    }
  }

  const headerProps: HeaderProps = {
    total: notifications.length,
    unread: unreadCount,
    onMarkAllRead: handleMarkAllRead,
    onViewAll: onToggle,
  }

  const bodyProps: BodyProps = {
    loading,
    loadingMore,
    error,
    groups,
    hasMore,
    total: notifications.length,
    onRetry: loadInitial,
    onLoadMore: handleLoadMore,
  }

  // ── Mobile: vaul bottom sheet ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <BellButton isOpen={isOpen} unreadCount={unreadCount} onClick={onToggle} />

        <Drawer.Root
          open={isOpen}
          onOpenChange={(open) => { if (!open && isOpen) onToggle() }}
          shouldScaleBackground={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" />
            <Drawer.Content
              className={cn(
                'fixed bottom-0 left-0 right-0 z-50',
                'flex max-h-[75vh] flex-col overflow-hidden',
                'rounded-t-[20px] border-t border-border/60',
                'bg-popover shadow-design-xl',
                'outline-none',
              )}
            >
              {/* Drag handle */}
              <div className="mx-auto mt-3 mb-0.5 h-1 w-9 shrink-0 rounded-full bg-border/60" />
              <NotifHeader {...headerProps} />
              <NotifBody {...bodyProps} />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </>
    )
  }

  // ── Desktop: absolute dropdown ───────────────────────────────────────────────
  return (
    <div className="relative">
      <BellButton isOpen={isOpen} unreadCount={unreadCount} onClick={onToggle} />

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />

          <div
            className={cn(
              'absolute right-0 top-[calc(100%+10px)] z-20',
              'flex w-[460px] max-h-[430px] flex-col overflow-hidden',
              'rounded-2xl border border-border/60 bg-popover',
              'shadow-design-xl',
              'animate-in fade-in slide-in-from-top-2 duration-200',
            )}
          >
            <NotifHeader {...headerProps} />
            <NotifBody {...bodyProps} />
          </div>
        </>
      )}
    </div>
  )
}
