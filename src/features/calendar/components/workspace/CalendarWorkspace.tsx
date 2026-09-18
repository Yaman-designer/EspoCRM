'use client'

import { useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarWeekHeader } from './CalendarWeekHeader'
import { CalendarTimeGrid } from './CalendarTimeGrid'
import { CalendarMonthGrid } from './CalendarMonthGrid'
import { CalendarAgendaList } from './CalendarAgendaList'
import { CalendarSkeleton } from './CalendarSkeleton'
import { CalendarEmptyState } from './CalendarEmptyState'
import { CalendarErrorState } from './CalendarErrorState'
import { buildMonthCells, resolveEffectiveViewTab } from '../../lib/range'
import type { CalendarInteractionState } from '../../hooks/useCalendarInteractionState'
import type { CalendarEvent, CalendarViewModel } from '../../types'

interface CalendarWorkspaceProps {
  viewModel: CalendarViewModel
  interaction: CalendarInteractionState
  isInitialLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
  onExport?: () => void
  onAddSchedule?: () => void
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (event: CalendarEvent) => void
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  className?: string
}

export function CalendarWorkspace({
  viewModel, interaction, isInitialLoading, isFetching, isError, onRetry,
  onExport, onAddSchedule, onEditEvent, onDeleteEvent,
  canCreate = true, canEdit = true, canDelete = true, className,
}: CalendarWorkspaceProps) {
  const isMobile = useIsMobile()

  // The underlying `viewTab` state is untouched by this — switching back to
  // a wide viewport restores Week automatically.
  const effectiveViewTab = resolveEffectiveViewTab(interaction.viewTab, isMobile)

  const monthCells = useMemo(
    () => buildMonthCells(interaction.anchorDate, interaction.todayDate),
    [interaction.anchorDate, interaction.todayDate],
  )

  const dayDate = viewModel.days[0]?.date
  const dayEvents = useMemo(
    () => (dayDate ? viewModel.events.filter((e) => e.date === dayDate) : []),
    [viewModel.events, dayDate],
  )

  let body: React.ReactNode
  if (isInitialLoading) {
    body = <CalendarSkeleton />
  } else if (isError) {
    body = <CalendarErrorState onRetry={onRetry} />
  } else if (effectiveViewTab === 'month') {
    body = <CalendarMonthGrid cells={monthCells} events={viewModel.events} onSelectDay={interaction.goToDayView} />
  } else if (viewModel.empty) {
    body = <CalendarEmptyState label={viewModel.visibleRangeLabel} onAddSchedule={onAddSchedule} canCreate={canCreate} />
  } else if (isMobile) {
    body = (
      <CalendarAgendaList
        events={dayEvents}
        selectedEventId={interaction.selectedEventId}
        onSelectEvent={interaction.setSelectedEventId}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    )
  } else {
    body = (
      <>
        <CalendarWeekHeader days={viewModel.days} />
        <CalendarTimeGrid
          days={viewModel.days}
          hours={viewModel.hours}
          events={viewModel.events}
          selectedEventId={interaction.selectedEventId}
          onSelectEvent={interaction.setSelectedEventId}
          onEditEvent={onEditEvent}
          onDeleteEvent={onDeleteEvent}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </>
    )
  }

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-design-sm">
        <CalendarToolbar
          viewTab={effectiveViewTab}
          onViewTabChange={interaction.setViewTab}
          compactTabs={isMobile}
          visibleRangeLabel={viewModel.visibleRangeLabel}
          onPrev={interaction.goToPrevPeriod}
          onNext={interaction.goToNextPeriod}
          onToday={interaction.goToToday}
          isFetching={isFetching && !isInitialLoading}
          onExport={onExport}
          onAddSchedule={onAddSchedule}
          canCreate={canCreate}
        />
        <div className="overflow-x-auto">
          <div className={effectiveViewTab === 'month' || isMobile ? undefined : 'min-w-140'}>
            {body}
          </div>
        </div>
      </div>
    </div>
  )
}
