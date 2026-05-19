'use client'

import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import Link from 'next/link'
import { Search, X, Loader2, UserRound, Headphones, Building2, Users, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { globalSearch, ENTITY_ROUTE } from '@/api/espocrm/searchService'
import type { SearchResult, SearchEntityType } from '@/api/espocrm/searchService'

// ── Entity display config ────────────────────────────────────────────────────

type EntityMeta = { icon: LucideIcon; bg: string; fg: string; labelKey: string }

const ENTITY_META: Record<SearchEntityType, EntityMeta> = {
  Contact:           { icon: UserRound,  bg: 'bg-violet-100', fg: 'text-violet-600', labelKey: 'search.entities.contact' },
  RealEstateRequest: { icon: Headphones, bg: 'bg-blue-100',   fg: 'text-blue-600',   labelKey: 'search.entities.request' },
  Account:           { icon: Building2,  bg: 'bg-orange-100', fg: 'text-orange-600', labelKey: 'search.entities.account' },
  EblaContractParty: { icon: Users,      bg: 'bg-slate-100',  fg: 'text-slate-500',  labelKey: 'search.entities.contract' },
}

// ── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// ── Search state via useReducer (avoids synchronous useState setters in effects) ─

type SearchState = {
  results: SearchResult[]
  loading: boolean
  open: boolean
}

type SearchAction =
  | { type: 'fetch_start' }
  | { type: 'fetch_done'; results: SearchResult[] }
  | { type: 'clear' }
  | { type: 'open' }

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'fetch_start': return { ...state, loading: true, open: true }
    case 'fetch_done':  return { loading: false, open: true, results: action.results }
    case 'clear':       return { results: [], loading: false, open: false }
    case 'open':        return { ...state, open: true }
  }
}

// ── Result item ──────────────────────────────────────────────────────────────

function ResultItem({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  const { t } = useTranslation('common')
  const meta = ENTITY_META[result.entityType]
  const Icon = meta.icon
  const href = `${ENTITY_ROUTE[result.entityType]}/${result.id}`

  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
    >
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
        <Icon className={cn('h-3.5 w-3.5', meta.fg)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{result.name}</p>
        <p className="text-[11px] text-muted-foreground">{t(meta.labelKey)}</p>
      </div>
    </Link>
  )
}

// ── Results panel ────────────────────────────────────────────────────────────

interface PanelProps {
  query: string
  results: SearchResult[]
  loading: boolean
  onClose: () => void
}

function ResultsPanel({ query, results, loading, onClose }: PanelProps) {
  const { t } = useTranslation('common')

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('search.searching')}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <SearchX className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-[13px] font-medium text-foreground/60">{t('search.noResults')}</p>
        <p className="text-[11px] text-muted-foreground/50">&ldquo;{query}&rdquo;</p>
      </div>
    )
  }

  // Group by entity type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.entityType]) acc[r.entityType] = []
    acc[r.entityType].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-1 p-2">
      {(Object.entries(grouped) as [SearchEntityType, SearchResult[]][]).map(([type, items]) => (
        <div key={type}>
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            {t(ENTITY_META[type].labelKey)}
          </p>
          {items.map((r) => <ResultItem key={r.id} result={r} onClose={onClose} />)}
        </div>
      ))}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

interface SearchDropdownProps {
  inputRef?: React.RefObject<HTMLInputElement | null>
  className?: string
  onClose?: () => void
}

export function SearchDropdown({ inputRef, className, onClose }: SearchDropdownProps) {
  const { t } = useTranslation('common')
  const [query, setQuery] = useState('')
  const [{ results, loading, open }, dispatch] = useReducer(searchReducer, {
    results: [],
    loading: false,
    open: false,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const localInputRef = useRef<HTMLInputElement>(null)
  const activeRef = inputRef ?? localInputRef
  const debouncedQuery = useDebounce(query, 320)

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (!q) {
      dispatch({ type: 'clear' })
      return
    }
    dispatch({ type: 'fetch_start' })
    let cancelled = false
    globalSearch(q).then((res) => {
      if (!cancelled) dispatch({ type: 'fetch_done', results: res })
    })
    return () => { cancelled = true }
  }, [debouncedQuery])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dispatch({ type: 'clear' })
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleClose = useCallback(() => {
    setQuery('')
    dispatch({ type: 'clear' })
    onClose?.()
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={activeRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim() && results.length > 0) dispatch({ type: 'open' }) }}
          placeholder={t('search')}
          className={cn(
            'h-10 w-full rounded-xl border border-border bg-muted/50',
            'ps-9 text-sm text-foreground placeholder:text-muted-foreground',
            'outline-none transition-all duration-200 focus:border-ring focus:ring-4 focus:ring-ring/12',
            query ? 'pe-9' : 'pe-4',
          )}
        />
        {query && (
          <button
            onClick={handleClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute start-0 top-[calc(100%+6px)] z-50',
            'w-full min-w-[320px] max-w-sm',
            'flex max-h-[380px] flex-col overflow-hidden',
            'rounded-2xl border border-border/60 bg-popover shadow-design-xl',
            'animate-in fade-in slide-in-from-top-2 duration-150',
          )}
        >
          <div className="overflow-y-auto overscroll-contain">
            <ResultsPanel
              query={debouncedQuery}
              results={results}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}
