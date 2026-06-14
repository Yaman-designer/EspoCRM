import axiosClient from '@/api/axiosClient'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type { Pipeline } from '../types'

const ATTRIBUTE_SELECT = [
  'contactsIds', 'contactsNames',
  'realEstatePropertiesIds', 'realEstatePropertiesNames',
  'contactType', 'status', 'status2', 'description',
  'assignedUserId', 'assignedUserName',
  'teamsIds', 'teamsNames',
].join(',')

export interface PipelineListParams {
  maxSize: number
  offset:  number
  orderBy: string
  order:   'asc' | 'desc'
}

export async function fetchPipelines(
  params: PipelineListParams,
): Promise<EspoListResponse<Pipeline>> {
  const res = await axiosClient.get<EspoListResponse<Pipeline>>('/CPipeline', {
    params: { ...params, attributeSelect: ATTRIBUTE_SELECT },
  })
  return res.data
}

export async function deletePipeline(id: string): Promise<void> {
  await axiosClient.delete(`/CPipeline/${id}`)
}

export async function bulkDeletePipelines(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => axiosClient.delete(`/CPipeline/${id}`)))
}
