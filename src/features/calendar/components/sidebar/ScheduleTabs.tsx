'use client'

import { cn } from '@/lib/utils'
import type { CalendarScheduleTab } from '../../types'

const TABS: { value: CalendarScheduleTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'mine', label: 'My Schedule' },
]

interface ScheduleTabsProps {
  value: CalendarScheduleTab
  onChange: (tab: CalendarScheduleTab) => void
}

export function ScheduleTabs({ value, onChange }: ScheduleTabsProps) {
  return (
    <div className="flex items-center gap-1 px-1" role="tablist" aria-label="Schedule scope">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
            value === tab.value
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
