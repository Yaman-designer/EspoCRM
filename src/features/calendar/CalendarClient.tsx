'use client'

import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { DynamicForm } from '@/components/dynamic-form/DynamicForm'
import { EntityDeleteDialog } from '@/components/crud/EntityDeleteDialog'
import { presentApiError } from '@/lib/errors/presentApiError'
import { useAuth } from '@/providers/AuthProvider'
import { useIsMobile } from '@/hooks/use-mobile'
import { deleteMeeting, MEETING_ENDPOINT } from '@/features/meetings/repositories/meeting.repository'
import {
  meetingEditDataTransform,
  meetingFormTransformSubmit,
  meetingSchema,
  meetingSections,
} from '@/features/meetings/form/meeting-form.config'
import { useMeetingPermissions } from '@/features/meetings/hooks/useMeetingPermissions'
import type { Meeting } from '@/features/meetings/types'
import { CalendarTemplate } from './components/CalendarTemplate'
import { useCalendarInteractionState } from './hooks/useCalendarInteractionState'
import { useCalendarData } from './hooks/useCalendarData'
import { resolveEffectiveViewTab } from './lib/range'
import { toISODate } from './lib/time'
import { MINI_MONTH, TASKS } from './fixtures/calendar.fixtures'
import type { CalendarEvent } from './types'

// ── CalendarClient ───────────────────────────────────────────────────────────
//
// Composition root — the one place in this feature allowed to know about
// Meeting, axios (via the repository), and React Query. Owns:
//   - live data (useCalendarData → Meeting → CalendarEvent → CalendarViewModel)
//   - navigation/selection state (useCalendarInteractionState)
//   - Create/Edit/Delete, wired through the project's existing DynamicForm /
//     EntityDeleteDialog — no parallel form or dialog system.
// Everything below CalendarTemplate only ever receives CalendarViewModel +
// plain callbacks/booleans.
export function CalendarClient() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const permissions = useMeetingPermissions()
  const isMobile = useIsMobile()

  const interaction = useCalendarInteractionState(MINI_MONTH, null)
  const effectiveViewTab = resolveEffectiveViewTab(interaction.viewTab, isMobile)

  const { viewModel, meetings, isInitialLoading, isFetching, isError, refetch } =
    useCalendarData(interaction.anchorDate, effectiveViewTab, interaction.todayDate, MINI_MONTH, TASKS)

  // ── Create / Edit ────────────────────────────────────────────────────────

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined)

  const openCreate = useCallback(() => {
    setFormMode('create')
    setEditingMeeting(undefined)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((event: CalendarEvent) => {
    const meeting = meetings.find((m) => m.id === event.id)
    if (!meeting) return
    setFormMode('edit')
    setEditingMeeting(meeting)
    setFormOpen(true)
  }, [meetings])

  const closeForm = useCallback(() => setFormOpen(false), [])

  const handleFormSuccess = useCallback(() => {
    setFormOpen(false)
    interaction.setSelectedEventId(null)
    queryClient.invalidateQueries({ queryKey: ['meetings'] })
  }, [queryClient, interaction])

  // New meeting defaults to the day currently in view, 9–10am, assigned to
  // the current user — not a fabricated business rule, just a sane starting
  // point the user edits before saving; nothing is submitted un-reviewed.
  const createDefaults = useMemo(() => {
    const dateStr = toISODate(interaction.anchorDate)
    return {
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '10:00',
      status: 'Planned',
      assignedUserId: session?.user?.id ?? '',
    }
  }, [interaction.anchorDate, session?.user?.id])

  // ── Delete ───────────────────────────────────────────────────────────────

  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | undefined>(undefined)

  const deleteMutation = useMutation({
    mutationFn: (event: CalendarEvent) => deleteMeeting(event.id),
    onSuccess: () => {
      toast.success('Meeting deleted')
      setDeleteTarget(undefined)
      interaction.setSelectedEventId(null)
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
    onError: (error) => {
      presentApiError(error, {
        entityLabel: 'meeting',
        onRetry: () => { if (deleteTarget) deleteMutation.mutate(deleteTarget) },
      })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Calendar" subtitle="Schedule and manage visits, calls, and meetings" />

      <CalendarTemplate
        viewModel={viewModel}
        interaction={interaction}
        isInitialLoading={isInitialLoading}
        isFetching={isFetching}
        isError={isError}
        onRetry={refetch}
        onAddSchedule={permissions.canCreate ? openCreate : undefined}
        onEditEvent={permissions.canEdit ? openEdit : undefined}
        onDeleteEvent={permissions.canDelete ? setDeleteTarget : undefined}
        canCreate={permissions.canCreate}
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
      />

      <DynamicForm
        open={formOpen}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
        title={formMode === 'edit' ? 'Edit Meeting' : 'Add Schedule'}
        icon={CalendarDays}
        sections={meetingSections}
        schema={meetingSchema}
        endpoint={MEETING_ENDPOINT}
        initialData={formMode === 'edit' && editingMeeting ? meetingEditDataTransform(editingMeeting) : undefined}
        defaultValues={formMode === 'create' ? createDefaults : undefined}
        mode={formMode}
        transformSubmit={meetingFormTransformSubmit}
      />

      <EntityDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(undefined) }}
        entityName={deleteTarget?.contactName ?? ''}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget) }}
        title="Delete Meeting"
      />
    </div>
  )
}
