import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPropertyBySlug } from './property.repository.server'

vi.mock('@/lib/env', () => ({ env: { espoApiUrl: 'https://espo.test/api/v1' } }))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const HEADERS = { 'Espo-Authorization': 'token-123' }

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchPropertyBySlug', () => {
  it('matches by propertyCode (uppercased) first, never calls the ID endpoint on a hit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ list: [{ id: 'real-id', propertyCode: 'DVL123' }] }),
    })

    const result = await fetchPropertyBySlug('dvl123', HEADERS)

    expect(result).toEqual({ id: 'real-id', propertyCode: 'DVL123' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(String(url)).toContain('where%5B0%5D%5Bvalue%5D=DVL123')
    expect(init.headers).toBe(HEADERS)
  })

  it('falls back to a direct ID fetch when the propertyCode match returns no results', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'uuid-here' }) })

    const result = await fetchPropertyBySlug('uuid-here', HEADERS)

    expect(result).toEqual({ id: 'uuid-here' })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(String(mockFetch.mock.calls[1][0])).toContain('/RealEstateProperty/uuid-here')
  })

  it('falls back to a direct ID fetch when the propertyCode request itself fails (non-ok response)', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'uuid-here' }) })

    const result = await fetchPropertyBySlug('uuid-here', HEADERS)
    expect(result).toEqual({ id: 'uuid-here' })
  })

  it('returns null when both the propertyCode and ID attempts fail', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })

    const result = await fetchPropertyBySlug('nonexistent', HEADERS)
    expect(result).toBeNull()
  })

  it('returns null (never throws) when fetch itself rejects on both attempts', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))

    const result = await fetchPropertyBySlug('anything', HEADERS)
    expect(result).toBeNull()
  })

  it('URL-encodes the slug in the direct ID fallback', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'x' }) })

    await fetchPropertyBySlug('has space/slash', HEADERS)
    expect(String(mockFetch.mock.calls[1][0])).toContain(encodeURIComponent('has space/slash'))
  })
})
