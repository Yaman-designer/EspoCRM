import { describe, it, expect, vi } from 'vitest'
import axiosClient from '@/api/axiosClient'
import {
  fetchProperties, deleteProperty, createProperty, updateProperty,
  fetchPropertyCount, isPropertyCodeTaken,
} from './property.repository'

vi.mock('@/api/axiosClient')

const mockGet = vi.mocked(axiosClient.get)
const mockPost = vi.mocked(axiosClient.post)
const mockPatch = vi.mocked(axiosClient.patch)
const mockDelete = vi.mocked(axiosClient.delete)

describe('property.repository', () => {
  describe('fetchProperties', () => {
    it('GETs /RealEstateProperty with pagination + where params merged', async () => {
      mockGet.mockResolvedValue({ data: { total: 0, list: [] } })
      await fetchProperties({ maxSize: 20, offset: 0, orderBy: 'createdAt', order: 'desc' }, { 'where[0][type]': 'equals' })

      expect(mockGet).toHaveBeenCalledWith('/RealEstateProperty', {
        params: { maxSize: 20, offset: 0, orderBy: 'createdAt', order: 'desc', 'where[0][type]': 'equals' },
      })
    })

    it('returns the raw EspoListResponse unchanged', async () => {
      const response = { total: 2, list: [{ id: '1' }, { id: '2' }] }
      mockGet.mockResolvedValue({ data: response })
      const result = await fetchProperties({ maxSize: 20, offset: 0, orderBy: 'createdAt', order: 'desc' })
      expect(result).toBe(response)
    })
  })

  describe('deleteProperty', () => {
    it('DELETEs /RealEstateProperty/{id}', async () => {
      mockDelete.mockResolvedValue({})
      await deleteProperty('prop-1')
      expect(mockDelete).toHaveBeenCalledWith('/RealEstateProperty/prop-1')
    })
  })

  describe('createProperty', () => {
    it('POSTs the payload to /RealEstateProperty and returns the created record', async () => {
      const created = { id: 'new-1', name: 'x', status: 'Under Approval' }
      mockPost.mockResolvedValue({ data: created })
      const result = await createProperty({ title: 'x' })
      expect(mockPost).toHaveBeenCalledWith('/RealEstateProperty', { title: 'x' })
      expect(result).toBe(created)
    })
  })

  describe('updateProperty', () => {
    it('PATCHes /RealEstateProperty/{id} and returns the updated record', async () => {
      const updated = { id: 'prop-1', name: 'x', status: 'Active' }
      mockPatch.mockResolvedValue({ data: updated })
      const result = await updateProperty('prop-1', { status: 'Active' })
      expect(mockPatch).toHaveBeenCalledWith('/RealEstateProperty/prop-1', { status: 'Active' })
      expect(result).toBe(updated)
    })
  })

  describe('fetchPropertyCount', () => {
    it('queries with an equals filter on the given attribute/value and returns total', async () => {
      mockGet.mockResolvedValue({ data: { total: 3, list: [] } })
      const count = await fetchPropertyCount('propertyCode', 'DVL68660')
      expect(mockGet).toHaveBeenCalledWith('/RealEstateProperty', {
        params: {
          maxSize: 1,
          'where[0][type]': 'equals',
          'where[0][attribute]': 'propertyCode',
          'where[0][value]': 'DVL68660',
        },
      })
      expect(count).toBe(3)
    })
  })

  describe('isPropertyCodeTaken', () => {
    it('without excludeId: taken when count > 0', async () => {
      mockGet.mockResolvedValue({ data: { total: 1, list: [] } })
      expect(await isPropertyCodeTaken('DVL68660')).toBe(true)
    })

    it('without excludeId: not taken when count is 0', async () => {
      mockGet.mockResolvedValue({ data: { total: 0, list: [] } })
      expect(await isPropertyCodeTaken('DVL68660')).toBe(false)
    })

    it('with excludeId: adds a notEquals(id) filter so editing a record does not flag its own code', async () => {
      mockGet.mockResolvedValue({ data: { total: 0, list: [] } })
      await isPropertyCodeTaken('DVL68660', 'prop-1')

      expect(mockGet).toHaveBeenCalledWith('/RealEstateProperty', {
        params: expect.objectContaining({
          'where[1][type]': 'notEquals',
          'where[1][attribute]': 'id',
          'where[1][value]': 'prop-1',
        }),
      })
    })
  })
})
