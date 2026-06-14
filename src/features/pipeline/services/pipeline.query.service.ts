import { fetchPipelines, type PipelineListParams } from '../repositories/pipeline.repository'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type { Pipeline } from '../types'

const DEFAULT_PARAMS: PipelineListParams = {
  maxSize: 200,
  offset:  0,
  orderBy: 'dateStart',
  order:   'desc',
}

export async function getPipelineList(): Promise<EspoListResponse<Pipeline>> {
  return fetchPipelines(DEFAULT_PARAMS)
}
