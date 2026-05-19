'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell, RefreshCw, Trash2, Clock,
 BellOff, AlertTriangle, X, Check,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  fetchNotifications,
  deleteNotification,
} from '@/api/espocrm/notificationService'
import type { EspoNotification } from '@/api/espocrm/notificationService'


import {
  ENTITY_CONFIG,
  getInitials,
  getAvatarColor,
  formatDisplayTime,
  buildMessage,
} from '@/lib/notificationUtils'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border/30 bg-card p-4">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded-[5px] bg-muted" />
          <div className="h-3.5 w-1/2 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-3 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-2.5 w-1/4 animate-pulse rounded-md bg-muted/60" />
      </div>
    </div>
  )
}

// ─── Notification card ────────────────────────────────────────────────────────

interface CardProps {
  n: EspoNotification
  confirming: boolean
  deleting: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function NotifCard({ n, confirming, deleting, onRequestDelete, onCancelDelete, onConfirmDelete }: CardProps) {
  const { t } = useTranslation('notifications')
  const isUnread = !n.read
  const msg = buildMessage(n, t)
  const entityCfg = ENTITY_CONFIG[n.noteData.parentType ?? '']
  const EntityIcon = entityCfg?.icon
  const avatarName = n.noteData.createdByName ?? 'System'

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-200',
        deleting && 'opacity-40 scale-[0.99] pointer-events-none',
        confirming
          ? 'border-destructive/30 bg-destructive/[0.03]'
          : isUnread
            ? 'border-primary/[0.18] bg-primary/[0.03] hover:bg-primary/[0.05]'
            : 'border-border/40 bg-card hover:border-border/60 hover:shadow-design-sm',
      )}
    >
      {/* Left accent for unread */}
      {isUnread && !confirming && (
        <div className="absolute left-0 inset-y-0 w-[3px] rounded-e-full bg-primary/80" />
      )}

      <div className={cn('flex items-start gap-4 p-4', isUnread && 'pl-5')}>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white',
              getAvatarColor(avatarName),
            )}
          >
            {getInitials(avatarName)}
          </div>
          {isUnread && (
            <span className="absolute -top-px -right-px h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">

          {/* Message */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 leading-snug">
            {EntityIcon && entityCfg && (
              <span className={cn('mr-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px]', entityCfg.bg)}>
                <EntityIcon className={cn('h-2.5 w-2.5', entityCfg.fg)} />
              </span>
            )}
            <span className="text-[13px] font-semibold text-foreground">{msg.actor}</span>
            <span className="text-[12.5px] text-muted-foreground">{msg.prefix}</span>
            {msg.parent && (
              <span className="text-[12.5px] font-medium text-primary">{msg.parent}</span>
            )}
            {msg.suffix && (
              <span className="text-[12.5px] text-muted-foreground">{msg.suffix}</span>

            )}
                    {/* Assigned user name — shown inline when API returns it */}
            {msg.assignedTo && (
              <span className="text-[12.5px] font-semibold text-foreground">{msg.assignedTo}</span>
            )}
          </div>

          {/* Post */}
          {n.noteData.post && (
            <p className="text-[12px] text-muted-foreground/75 leading-tight">
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
          <div className="flex items-center gap-1 pt-0.5 text-[11px] text-muted-foreground/50">
            <Clock className="h-2.5 w-2.5 shrink-0" />
            {formatDisplayTime(n.createdAt)}
          </div>
        </div>

        {/* Right: unread dot + delete */}
        <div className="flex shrink-0 flex-col items-end gap-2 self-start">
          {isUnread && (
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {!confirming && (
            <button
              onClick={onRequestDelete}
              aria-label={t('delete')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                'text-muted-foreground/40 transition-all duration-150',
                'opacity-0 group-hover:opacity-100',
                'hover:bg-destructive/10 hover:text-destructive',
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline confirmation bar */}
      {confirming && (
        <div className="flex items-center justify-between gap-3 border-t border-destructive/20 bg-destructive/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-2 text-[12px] text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t('deleteConfirm')}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancelDelete}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <X className="h-3 w-3" /> {t('cancel')}
            </button>
            <button
              onClick={onConfirmDelete}
              className="flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-destructive/90"
            >
              <Check className="h-3 w-3" /> {t('delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const { t } = useTranslation('notifications')

  const [notifications, setNotifications] = useState<EspoNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Shared fetch logic for event handlers (refresh, load-more).
  // Event handlers can freely call useCallback functions that update state.
  const load = useCallback(async (offset: number, append: boolean) => {
    try {
      const data = await fetchNotifications(PAGE_SIZE, offset)
      setNotifications((prev) =>
        append ? [...prev, ...data.list] : data.list,
      )
      setHasMore(data.list.length === PAGE_SIZE)
      setError(null)
    } catch (err) {
      console.error('[NotificationsPage] Failed to load notifications:', err)
      setError(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // Initial load: call fetchNotifications (external library fn) directly so the
  // linter does not flag a user-defined useCallback that contains setState.
  // State updates happen only in .then/.catch callbacks — never synchronously.
  useEffect(() => {
    let cancelled = false
    fetchNotifications(PAGE_SIZE, 0)
      .then((data) => {
        if (!cancelled) {
          setNotifications(data.list)
          setHasMore(data.list.length === PAGE_SIZE)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error('[NotificationsPage] Failed to load notifications:', err)
          setError(t('loadFailed'))
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [t])

  async function handleRefresh() {
    setRefreshing(true)
    setConfirmingId(null)
    await load(0, false)
    setRefreshing(false)
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    await load(notifications.length, true)
    setLoadingMore(false)
  }

  async function handleConfirmDelete(id: string) {
    setDeletingId(id)
    setConfirmingId(null)
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
     } catch (err) {
      console.error('[NotificationsPage] Failed to delete notification:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
              {t('title')}
            </h1>
            {!loading && (
              <p className="text-[11px] text-muted-foreground/60">
                {t('count', { count: notifications.length })}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          aria-label={t('refresh')}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border border-border',
            'bg-background text-muted-foreground transition-all duration-200',
            'hover:bg-muted hover:text-foreground',
            'disabled:opacity-40',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border/40 bg-card p-10 text-center">
          <p className="text-[13px] text-muted-foreground">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 flex items-center gap-1.5 mx-auto text-[12px] font-medium text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> {t('tryAgain')}
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <BellOff className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-medium text-foreground/70">{t('allCaughtUp')}</p>
            <p className="text-[12px] text-muted-foreground/50">{t('noNotifications')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <NotifCard
              key={n.id}
              n={n}
              confirming={confirmingId === n.id}
              deleting={deletingId === n.id}
              onRequestDelete={() => setConfirmingId(n.id)}
              onCancelDelete={() => setConfirmingId(null)}
              onConfirmDelete={() => handleConfirmDelete(n.id)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && (
        <div className="pt-1">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border border-border',
              'bg-card py-3 text-[13px] font-medium text-muted-foreground',
              'transition-colors hover:bg-muted hover:text-foreground',
              'disabled:opacity-40',
            )}
          >
            {loadingMore && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {loadingMore ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}

    </div>
  )
}
