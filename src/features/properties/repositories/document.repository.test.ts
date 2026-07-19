import { describe, it, expect, vi } from 'vitest'
import axiosClient from '@/api/axiosClient'
import {
  createDocument, deleteDocument, relateDocument, unrelateDocument,
} from './document.repository'

vi.mock('@/api/axiosClient')

const mockPost = vi.mocked(axiosClient.post)
const mockDelete = vi.mocked(axiosClient.delete)

describe('document.repository', () => {
  it('createDocument POSTs to /Document with the full required payload (name/fileId/publishDate/assignedUserId)', async () => {
    const created = { id: 'doc-1', name: 'x', fileId: 'file-1', publishDate: '2026-07-16' }
    mockPost.mockResolvedValue({ data: created })
    const payload = { name: 'x', fileId: 'file-1', publishDate: '2026-07-16', assignedUserId: 'user-1' }
    const result = await createDocument(payload)
    expect(mockPost).toHaveBeenCalledWith('/Document', payload)
    expect(result).toBe(created)
  })

  it('deleteDocument DELETEs /Document/{id} — entity-level delete, best-effort caller responsibility', async () => {
    mockDelete.mockResolvedValue({})
    await deleteDocument('doc-1')
    expect(mockDelete).toHaveBeenCalledWith('/Document/doc-1')
  })

  it('relateDocument POSTs { id } to the property\'s documents sub-resource', async () => {
    mockPost.mockResolvedValue({})
    await relateDocument('prop-1', 'doc-1')
    expect(mockPost).toHaveBeenCalledWith('/RealEstateProperty/prop-1/documents', { id: 'doc-1' })
  })

  it('unrelateDocument sends the id in the request BODY, not the URL — EspoCRM\'s real contract (live-confirmed Wave 7; the ordinary REST DELETE/{id} path 404s)', async () => {
    mockDelete.mockResolvedValue({})
    await unrelateDocument('prop-1', 'doc-1')
    expect(mockDelete).toHaveBeenCalledWith('/RealEstateProperty/prop-1/documents', { data: { id: 'doc-1' } })
    // Guards against ever regressing to the plausible-but-wrong REST path.
    expect(mockDelete).not.toHaveBeenCalledWith('/RealEstateProperty/prop-1/documents/doc-1')
  })
})
