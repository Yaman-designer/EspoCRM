'use client'

import { ChevronLeft, ChevronRight, Download, Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalendarViewTab } from '../../types'

interface CalendarToolbarProps {
  viewTab: CalendarViewTab
  onViewTabChange: (tab: CalendarViewTab) => void
  /** Hides the Week tab and forces Day/Month only — the mobile view set (a 7-column grid has nowhere to go under ~480px). */
  compactTabs?: boolean
  visibleRangeLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isFetching?: boolean
  onExport?: () => void
  onAddSchedule?: () => void
  canCreate?: boolean
}

export function CalendarToolbar({
  viewTab, onViewTabChange, compactTabs,
  visibleRangeLabel, onPrev, onNext, onToday, isFetching,
  onExport, onAddSchedule, canCreate = true,
}: CalendarToolbarProps) {
  const viewTabs: { value: CalendarViewTab; label: string }[] = compactTabs
    ? [{ value: 'day', label: 'Day' }, { value: 'month', label: 'Month' }]
    : [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border/60 px-3 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <nav className="flex items-center gap-3 sm:gap-4" aria-label="Calendar view">
          {viewTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-current={viewTab === tab.value ? 'true' : undefined}
              onClick={() => onViewTabChange(tab.value)}
              className={cn(
                'relative pb-1 text-[13px] font-semibold transition-colors',
                viewTab === tab.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {viewTab === tab.value && (
                <span className="absolute inset-x-0 -bottom-3.25 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </nav>

        {/* icon-lg (48px) on mobile meets the ≥44px touch-target guidance —
            icon-xs (28px) is fine on desktop, where these are mouse targets. */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size={compactTabs ? 'icon-lg' : 'icon-xs'} aria-label="Previous period" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size={compactTabs ? 'sm' : 'xs'} onClick={onToday}>
            Today
          </Button>
          <Button variant="ghost" size={compactTabs ? 'icon-lg' : 'icon-xs'} aria-label="Next period" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          {visibleRangeLabel}
          {isFetching && <RotateCw className="h-3 w-3 animate-spin text-muted-foreground/60" aria-hidden="true" />}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport} className="max-sm:hidden">
          <Download />
          Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={onAddSchedule}>
            <Plus />
            <span className="max-[420px]:hidden">Add Schedule</span>
          </Button>
        )}
      </div>
    </div>
  )
}
