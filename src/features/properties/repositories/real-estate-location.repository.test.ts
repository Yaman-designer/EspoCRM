import { describe, it, expect, vi } from 'vitest'
import axiosClient from '@/api/axiosClient'
import { fetchChildLocations, fetchLocationById } from './real-estate-location.repository'

vi.mock('@/api/axiosClient')

const mockGet = vi.mocked(axiosClient.get)

describe('real-estate-location.repository', () => {
  describe('fetchChildLocations', () => {
    it('returns [] without calling the API when parentId is empty', async () => {
      expect(await fetchChildLocations('')).toEqual([])
      expect(mockGet).not.toHaveBeenCalled()
    })

    it('queries children via the equals(parentId) whereGroup, name-only, ascending', async () => {
      mockGet.mockResolvedValue({ data: { total: 1, list: [{ id: 'loc-1', name: 'Athens' }] } })
      const result = await fetchChildLocations('region-1')

      expect(mockGet).toHaveBeenCalledWith('/RealEstateLocation', {
        params: {
          maxSize: 200,
          offset: 0,
          orderBy: 'name',
          order: 'asc',
          'whereGroup[0][type]': 'equals',
          'whereGroup[0][attribute]': 'parentId',
          'whereGroup[0][value]': 'region-1',
          attributeSelect: 'name',
        },
      })
      expect(result).toEqual([{ id: 'loc-1', name: 'Athens' }])
    })
  })

  describe('fetchLocationById', () => {
    it('returns null without calling the API when id is empty', async () => {
      expect(await fetchLocationById('')).toBeNull()
      expect(mockGet).not.toHaveBeenCalled()
    })

    it('fetches a single location by id, selecting only name', async () => {
      mockGet.mockResolvedValue({ data: { id: 'loc-1', name: 'Athens' } })
      const result = await fetchLocationById('loc-1')

      expect(mockGet).toHaveBeenCalledWith('/RealEstateLocation/loc-1', { params: { attributeSelect: 'name' } })
      expect(result).toEqual({ id: 'loc-1', name: 'Athens' })
    })
  })
})
