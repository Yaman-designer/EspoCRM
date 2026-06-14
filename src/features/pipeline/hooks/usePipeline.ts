'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Pipeline, PipelineFormValues } from '../types'
import { deletePipeline, bulkDeletePipelines } from '../repositories/pipeline.repository'
import { getPipelineList } from '../services/pipeline.query.service'

export const PIPELINE_QUERY_KEY = 'pipeline'

export function usePipeline() {
  const { t } = useTranslation('dashboard')
  const queryClient = useQueryClient()

  // ── Data ──────────────────────────────────────────────────────────────────────

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [PIPELINE_QUERY_KEY],
    queryFn:  getPipelineList,
    staleTime: 30_000,
  })

  // ── Edit state ────────────────────────────────────────────────────────────────

  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow]   = useState<Pipeline | undefined>()

  const handleEdit = useCallback((row: Pipeline) => {
    setEditRow(row)
    setEditOpen(true)
  }, [])

  const handleEditClose = useCallback(() => {
    setEditOpen(false)
    setEditRow(undefined)
  }, [])

  const editInitialData = useMemo((): PipelineFormValues | undefined => {
    if (!editRow) return undefined
    return {
      id:             editRow.id,
      assignedUserId: editRow.assignedUserId || undefined,
      teamsIds:       editRow.teamsIds ?? [],
      contactsIds:    editRow.contactsIds?.[0] ?? '',
      contactType:    editRow.contactType || '',
      status2:        editRow.status2 && editRow.status2 !== 'none' ? editRow.status2 : '',
      dateStart:      editRow.dateStart?.substring(0, 10) ?? '',
      description:    editRow.description ?? '',
    }
  }, [editRow])

  // ── View state ────────────────────────────────────────────────────────────────

  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow]   = useState<Pipeline | undefined>()

  const handleView = useCallback((row: Pipeline) => {
    setViewRow(row)
    setViewOpen(true)
  }, [])

  // ── Delete state ──────────────────────────────────────────────────────────────

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRow, setDeleteRow]   = useState<Pipeline | undefined>()

  const handleDelete = useCallback((row: Pipeline) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePipeline(id),
    onSuccess: () => {
      toast.success(t('pipeline.actions.deleteSuccess'))
      setDeleteOpen(false)
      setDeleteRow(undefined)
      queryClient.invalidateQueries({ queryKey: [PIPELINE_QUERY_KEY] })
    },
    onError: () => {
      toast.error(t('pipeline.actions.deleteError'))
    },
  })

  // ── Bulk delete ───────────────────────────────────────────────────────────────

  const bulkDeleteMutation = useMutation({
    mutationFn: (rows: Pipeline[]) => bulkDeletePipelines(rows.map(r => r.id)),
    onSuccess: (_, rows) => {
      toast.success(
        rows.length === 1
          ? t('pipeline.actions.deleteSuccess')
          : t('pipeline.actions.bulkDeleteSuccess', { count: rows.length }),
      )
      queryClient.invalidateQueries({ queryKey: [PIPELINE_QUERY_KEY] })
    },
    onError: () => {
      toast.error(t('pipeline.actions.deleteError'))
      queryClient.invalidateQueries({ queryKey: [PIPELINE_QUERY_KEY] })
    },
  })

  return {
    data,
    isFetching,
    isError,
    refetch,
    editOpen,
    editRow,
    editInitialData,
    handleEdit,
    handleEditClose,
    viewOpen,
    viewRow,
    setViewOpen,
    handleView,
    deleteOpen,
    deleteRow,
    setDeleteOpen,
    setDeleteRow,
    handleDelete,
    deleteMutation,
    bulkDeleteMutation,
  }
}
