import axiosClient from '@/api/axiosClient'

export interface EspoListResponse<T> {
  total: number
  list: T[]
}

export interface ListParams {
  maxSize?: number
  offset?: number
  orderBy?: string
  order?: 'asc' | 'desc'
  textFilter?: string
}

export async function getEntityList<T>(
  entityType: string,
  params: ListParams = {}
): Promise<EspoListResponse<T>> {
  const { data } = await axiosClient.get<EspoListResponse<T>>(`/${entityType}`, { params })
  return data
}

export async function createEntity<T>(entityType: string, payload: Partial<T>): Promise<T> {
  const { data } = await axiosClient.post<T>(`/${entityType}`, payload)
  return data
}

export async function updateEntity<T>(
  entityType: string,
  id: string,
  payload: Partial<T>
): Promise<T> {
  const { data } = await axiosClient.put<T>(`/${entityType}/${id}`, payload)
  return data
}

export async function deleteEntity(entityType: string, id: string): Promise<void> {
  await axiosClient.delete(`/${entityType}/${id}`)
}