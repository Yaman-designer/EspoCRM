'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'
import axiosClient from '@/api/axiosClient'
import { DynamicForm } from '@/components/dynamic-form'
import { pipelineSchema } from './schema'
import { STAGE_OPTIONS, CONTACT_TYPE_OPTIONS } from './fields'
import type { FormProps } from '@/components/data-table'
import type { FormSectionConfig, SelectOption } from '@/components/dynamic-form'
import type { Pipeline } from './types'

// ── EspoCRM list response shape ────────────────────────────────────────────────
interface EspoList<T = Record<string, string>> {
  list: T[]
  total: number
}

export function PipelineForm({ open, onClose, onSuccess, initialData, mode }: FormProps<Pipeline>) {
  const { t } = useTranslation('dashboard')

  // ── Async option lists (fetched once on mount, same as reference) ─────────────
  const [users, setUsers] = useState<SelectOption[]>([])
  const [teams, setTeams] = useState<SelectOption[]>([])
  const [contacts, setContacts] = useState<SelectOption[]>([])

  useEffect(() => {
    axiosClient
      .get<EspoList>('/User', {
        params: { maxSize: 50, offset: 0, orderBy: 'name', order: 'asc', attributeSelect: 'id,name' },
      })
      .then((res) => setUsers(res.data.list.map((u) => ({ label: u.name, value: u.id }))))
      .catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    axiosClient
      .get<EspoList>('/Team', {
        params: { maxSize: 50, offset: 0, attributeSelect: 'id,name' },
      })
      .then((res) => setTeams(res.data.list.map((tm) => ({ label: tm.name, value: tm.id }))))
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    axiosClient
      .get<EspoList>('/Contact', {
        params: { maxSize: 50, offset: 0, orderBy: 'name', order: 'asc', attributeSelect: 'id,name' },
      })
      .then((res) => setContacts(res.data.list.map((c) => ({ label: c.name, value: c.id }))))
      .catch(() => setContacts([]))
  }, [])

  // ── Form sections ─────────────────────────────────────────────────────────────
  const sections = useMemo<FormSectionConfig[]>(() => [
    {
      key: 'agent',
      title: t('pipeline.form.sectionAgent'),
      columns: 2,
      fields: [
        {
          name: 'assignedUserId',
          label: t('pipeline.form.assignedUser'),
          type: 'select',
          options: users,
          placeholder: t('pipeline.form.selectUser'),
        },
        {
          name: 'teamsIds',
          label: t('pipeline.form.teams'),
          type: 'multi-select',
          options: teams,
          placeholder: t('pipeline.form.selectTeams'),
        },
      ],
    },
    {
      key: 'pipeline',
      title: t('pipeline.form.sectionPipeline'),
      columns: 2,
      fields: [
        {
          name: 'contactsIds',
          label: t('pipeline.form.contact'),
          type: 'select',
          required: true,
          options: contacts,
          placeholder: t('pipeline.form.selectContact'),
        },
        {
          name: 'contactType',
          label: t('pipeline.form.contactType'),
          type: 'select',
          required: true,
          options: CONTACT_TYPE_OPTIONS,
          placeholder: t('pipeline.form.selectContactType'),
        },
        {
          name: 'status2',
          label: t('pipeline.form.stage'),
          type: 'select',
          options: STAGE_OPTIONS,
          placeholder: t('pipeline.form.selectStage'),
        },
        {
          name: 'dateStart',
          label: t('pipeline.form.dateStart'),
          type: 'date',
          required: true,
        },
        {
          name: 'description',
          label: t('pipeline.form.description'),
          type: 'textarea',
          colSpan: 2,
          rows: 3,
        },
      ],
    },
  ], [t, users, teams, contacts])

  // ── Payload transformer ───────────────────────────────────────────────────────
 const transformSubmit = useCallback((values: Record<string, unknown>) => {
  const contactType = (values.contactType as string) || 'pipeline'
  const rawDate = values.dateStart as string | undefined
  const dateStart = rawDate ? `${rawDate.substring(0, 10)} 00:00:00` : undefined
  return {
    ...values,
    name: `${contactType} - ${new Date().toLocaleDateString('en-US')}`,
    status: 'Planned',
    dateStart,
    assignedUserId: (values.assignedUserId as string) || undefined,
    contactsIds: values.contactsIds ? [values.contactsIds] : undefined,
    teamsIds:
      Array.isArray(values.teamsIds) && values.teamsIds.length > 0
        ? values.teamsIds
        : undefined,
  }
}, [])

  return (
    <DynamicForm<Pipeline>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={mode === 'edit' ? t('pipeline.form.editTitle') : t('pipeline.form.addTitle')}
      description={mode === 'edit' ? t('pipeline.form.editDesc') : t('pipeline.form.addDesc')}
      icon={TrendingUp}
      sections={sections}
      schema={pipelineSchema}
      endpoint="/CPipeline"
      initialData={initialData}
      mode={mode}
      maxWidth="2xl"
      transformSubmit={transformSubmit}
    />
  )
}
