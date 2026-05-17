import axiosClient from '@/api/axiosClient'

export interface NoteData {
  id: string
  post: string | null
  type: 'Post' | 'Create' | 'Assign' | string
  parentId: string | null
  parentType: string | null
  parentName: string | null
  createdById: string | null
  createdByName: string | null
  data: {
    assignedUserId?: string
    assignedUserName?: string
    statusValue?: string
    statusField?: string
  }
}

export interface EspoNotification {
  id: string
  read: boolean
  createdAt: string
  noteData: NoteData
  type: string
}

export interface NotificationListResponse {
  total: number
  list: EspoNotification[]
}

export async function fetchNotifications(maxSize = 5, offset = 0): Promise<NotificationListResponse> {
  const res = await axiosClient.get<NotificationListResponse>('/Notification', {
    params: { maxSize, offset, orderBy: 'number', order: 'desc' },
  })
  return res.data
}

export async function markAllRead(): Promise<void> {
  await axiosClient.post('/Notification/action/markAllRead')
}

export async function deleteNotification(id: string): Promise<void> {
  await axiosClient.delete(`/Notification/${id}`)
}
