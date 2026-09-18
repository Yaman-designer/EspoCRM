import { z } from 'zod'
import { CalendarDays } from 'lucide-react'
import type { FormSectionConfig } from '@/components/dynamic-form/types'
import { toEspoDateTime } from '../repositories/meeting.repository'
import type { Meeting } from '../types'

// ── Meeting create/edit form ─────────────────────────────────────────────────
//
// No Meeting form existed anywhere in the project (Part 8's "smallest
// adapter necessary" case) — this reuses the same DynamicForm engine every
// other entity (Calls, Contacts, Properties' list…) already uses, following
// callsConfig's shape (Meeting is a close sibling of Call). No parallel form
// system, no new dialog infrastructure.
//
// dateStart/dateEnd are stored as one EspoCRM datetime string each, but the
// project's existing 'date' field type is date-only (FormDatePicker truncates
// to YYYY-MM-DD — see its own header) and there is no combined datetime field
// anywhere in this form engine. Rather than build one (out of scope — a
// shared-infrastructure change, not a Calendar one), this form uses the
// existing 'date' + 'time' field pair for each side and recombines them here.

export const meetingSchema = z
  .object({
    name: z.string().min(1, 'Subject is required'),
    status: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endDate: z.string().min(1, 'End date is required'),
    endTime: z.string().min(1, 'End time is required'),
    assignedUserId: z.string().optional(),
    description: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T${data.startTime}:00`)
    const end = new Date(`${data.endDate}T${data.endTime}:00`)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End must be after start', path: ['endTime'] })
    }
  })

export const meetingSections: FormSectionConfig[] = [
  {
    key: 'details',
    title: 'Meeting Details',
    icon: CalendarDays,
    columns: 2,
    fields: [
      { name: 'name', label: 'Subject', type: 'text', required: true, placeholder: 'Meeting subject', colSpan: 2 },
      {
        name: 'status', label: 'Status', type: 'select',
        options: [
          { value: 'Planned', label: 'Planned' },
          { value: 'Held', label: 'Held' },
          { value: 'Not Held', label: 'Not Held' },
        ],
      },
      { name: 'assignedUserId', label: 'Assigned To', type: 'select', resource: 'users', placeholder: 'Select team member…' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'startTime', label: 'Start Time', type: 'time', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'endTime', label: 'End Time', type: 'time', required: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3, colSpan: 2, placeholder: 'Notes about this meeting…' },
    ],
  },
]

/** Splits a Meeting's combined dateStart/dateEnd into the form's separate date/time fields. */
export function meetingEditDataTransform(meeting: Meeting): Record<string, unknown> {
  const [startDate, startTime] = meeting.dateStart.split(' ')
  const [endDate, endTime] = meeting.dateEnd.split(' ')
  return {
    id: meeting.id, // read by DynamicForm to build the PATCH URL — stripped from the actual submit payload since it isn't a declared form field
    name: meeting.name,
    status: meeting.status,
    assignedUserId: meeting.assignedUserId ?? '',
    startDate,
    startTime: startTime?.slice(0, 5) ?? '',
    endDate,
    endTime: endTime?.slice(0, 5) ?? '',
    description: meeting.description ?? '',
  }
}

/** Recombines the form's date/time field pairs into EspoCRM's single dateStart/dateEnd datetime strings before submit. */
export function meetingFormTransformSubmit(values: Record<string, unknown>): Record<string, unknown> {
  const startDate = String(values.startDate ?? '')
  const startTime = String(values.startTime ?? '')
  const endDate = String(values.endDate ?? '')
  const endTime = String(values.endTime ?? '')

  const dateStart = toEspoDateTime(new Date(`${startDate}T${startTime}:00`))
  const dateEnd = toEspoDateTime(new Date(`${endDate}T${endTime}:00`))

  return {
    name: values.name,
    status: values.status || 'Planned',
    assignedUserId: values.assignedUserId || undefined,
    description: values.description || undefined,
    dateStart,
    dateEnd,
  }
}
