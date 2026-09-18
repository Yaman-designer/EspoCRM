'use client'

import { useState } from 'react'
import { ChevronDown, ListChecks } from 'lucide-react'
import { ReminderList } from '@/components/dashboard/overview/ReminderList'
import { CalendarWidget } from '@/components/dashboard/overview/CalendarWidget'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ScheduleTabs } from './ScheduleTabs'
import { TaskList } from './TaskList'
import type { CalendarInteractionState } from '../../hooks/useCalendarInteractionState'
import type { CalendarViewModel } from '../../types'

interface CalendarSidebarProps {
  viewModel: CalendarViewModel
  interaction: CalendarInteractionState
  className?: string
}

function SchedulePanel({ viewModel, interaction }: CalendarSidebarProps) {
  const { miniMonth } = viewModel
  return (
    // Matches ReminderList's own card chrome (rounded-xl/border-border/50/
    // shadow-sm→hover:shadow-md) exactly, rather than the project's other
    // shadow-design-sm/rounded-2xl convention — the two sidebar panels read
    // as one cohesive operational rail instead of two visually different cards.
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md">
      <CalendarWidget
        year={interaction.miniMonthCursor.year}
        month={interaction.miniMonthCursor.month}
        today={miniMonth.today}
        activeDays={miniMonth.activeDays}
        onPrevMonth={interaction.goToPrevMonth}
        onNextMonth={interaction.goToNextMonth}
        onSelectDay={(day) => interaction.goToDate(new Date(interaction.miniMonthCursor.year, interaction.miniMonthCursor.month, day))}
        className="border-0 shadow-none"
      />

      <Separator className="opacity-60" />

      <div className="px-4 py-3">
        <ScheduleTabs value={interaction.scheduleTab} onChange={interaction.setScheduleTab} />
      </div>

      <Separator className="opacity-60" />

      <div className="px-3 py-2">
        <TaskList
          tasks={viewModel.tasks}
          scheduleTab={interaction.scheduleTab}
          completedTaskIds={interaction.completedTaskIds}
          onToggle={interaction.toggleTask}
        />
      </div>
    </div>
  )
}

// ── CalendarSidebar ──────────────────────────────────────────────────────────
//
// Two structures share the same content pieces (ReminderList, the mini
// calendar, schedule tabs, tasks) rather than one component trying to be both:
// - md+ (tablet/desktop): always expanded, matches the reference composition.
// - below md: a single compact, collapsible summary row — Part 4's
//   "collapsible panel" option — so the mini-calendar/reminders/tasks stay
//   reachable without permanently eating vertical space above the agenda.
export function CalendarSidebar({ viewModel, interaction, className }: CalendarSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={className}>
      {/* Tablet/desktop — always expanded */}
      <div className="hidden flex-col gap-4 md:flex">
        <ReminderList />
        <SchedulePanel viewModel={viewModel} interaction={interaction} />
      </div>

      {/* Mobile — collapsible */}
      <div className="md:hidden">
        <Collapsible open={mobileOpen} onOpenChange={setMobileOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              aria-expanded={mobileOpen}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <ListChecks className="h-4 w-4 text-primary" />
                Reminders &amp; Schedule
              </span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-(--duration-medium)', mobileOpen && 'rotate-180')} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 flex flex-col gap-4 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-open:duration-(--duration-standard) data-closed:animate-out data-closed:fade-out-0">
            <ReminderList />
            <SchedulePanel viewModel={viewModel} interaction={interaction} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
