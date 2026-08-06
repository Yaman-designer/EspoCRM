'use client'

import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SaveState } from './types'

function timeAgo(date: Date, t: TFunction): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 5)  return t('formFramework.saveIndicator.justNow')
  if (s < 60) return t('formFramework.saveIndicator.secAgo', { count: s })
  const m = Math.floor(s / 60)
  if (m < 60) return t('formFramework.saveIndicator.minAgo', { count: m })
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface SaveStateIndicatorProps {
  state: SaveState
  onRetry?: () => void
  className?: string
}

export function SaveStateIndicator({
  state,
  onRetry,
  className,
}: SaveStateIndicatorProps) {
  const { t } = useTranslation('common')
  if (state.status === 'idle') return null

  const map = {
    saving: {
      icon: Loader2,
      label: t('formFramework.saveIndicator.saving'),
      cls: 'text-muted-foreground',
      spin: true,
    },
    saving_draft: {
      icon: Loader2,
      label: t('formFramework.saveIndicator.savingDraft'),
      cls: 'text-muted-foreground',
      spin: true,
    },
    saved: {
      icon: CheckCircle2,
      label: t('formFramework.saveIndicator.saved'),
      cls: 'text-brand-emerald',
      spin: false,
    },
    autosaved: {
      icon: CheckCircle2,
      label: t('formFramework.saveIndicator.autosaved'),
      cls: 'text-brand-emerald',
      spin: false,
    },
    draft: {
      icon: FileText,
      label: t('formFramework.saveIndicator.draft'),
      cls: 'text-brand-azure',
      spin: false,
    },
    failed: {
      icon: AlertTriangle,
      label: t('formFramework.saveIndicator.saveFailed'),
      cls: 'text-destructive',
      spin: false,
    },
    unsaved: {
      icon: Circle,
      label: t('formFramework.saveIndicator.unsavedChanges'),
      cls: 'text-muted-foreground/70',
      spin: false,
    },
  } as const

  const cfg = map[state.status]
  if (!cfg) return null

  const Icon = cfg.icon

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium transition-all duration-300',
        cfg.cls,
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon
        className={cn('h-3 w-3 shrink-0', cfg.spin && 'animate-spin')}
        aria-hidden
      />
      <span>{cfg.label}</span>

      {/* Timestamp for saved/autosaved */}
      {state.savedAt && (state.status === 'saved' || state.status === 'autosaved') && (
        <span className="text-muted-foreground/50 flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" aria-hidden />
          {timeAgo(state.savedAt, t)}
        </span>
      )}

      {/* Retry button for failed state */}
      {state.status === 'failed' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-0.5 flex items-center gap-0.5 underline underline-offset-2 hover:opacity-80"
          aria-label={t('formFramework.saveIndicator.retryAria')}
        >
          <RefreshCw className="h-2.5 w-2.5" aria-hidden />
          {t('formFramework.saveIndicator.retry')}
        </button>
      )}

      {/* Error detail */}
      {state.status === 'failed' && state.error && (
        <span className="text-destructive/60 truncate max-w-[140px]" title={state.error}>
          — {state.error}
        </span>
      )}
    </div>
  )
}
