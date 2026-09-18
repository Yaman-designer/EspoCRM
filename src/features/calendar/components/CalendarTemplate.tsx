import { CalendarSidebar } from './sidebar/CalendarSidebar'
import { CalendarWorkspace } from './workspace/CalendarWorkspace'
import type { CalendarInteractionState } from '../hooks/useCalendarInteractionState'
import type { CalendarEvent, CalendarViewModel } from '../types'

export interface CalendarTemplateProps {
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
}

// ── CalendarTemplate ─────────────────────────────────────────────────────────
//
// Pure presentation: every value it renders comes from `viewModel` (data),
// `interaction` (ephemeral UI state), or plain callback/boolean props — no
// fetching, no fixture import, no axios, no EspoCRM/Meeting types anywhere
// below this component. CalendarClient is the only place those exist.
export function CalendarTemplate({
  viewModel, interaction, isInitialLoading, isFetching, isError, onRetry,
  onExport, onAddSchedule, onEditEvent, onDeleteEvent, canCreate, canEdit, canDelete,
}: CalendarTemplateProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <CalendarSidebar viewModel={viewModel} interaction={interaction} className="w-full lg:w-75 lg:shrink-0" />
      <CalendarWorkspace
        viewModel={viewModel}
        interaction={interaction}
        isInitialLoading={isInitialLoading}
        isFetching={isFetching}
        isError={isError}
        onRetry={onRetry}
        onExport={onExport}
        onAddSchedule={onAddSchedule}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        className="min-w-0 flex-1"
      />
    </div>
  )
}
