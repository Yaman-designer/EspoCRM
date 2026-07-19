import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/env', () => ({ env: { espoApiUrl: 'https://fake-espo.test/api/v1' } }))
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/lib/auth'
import { GET } from './route'

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(query)}`)
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ espoToken: 'fake-token' } as never)
    vi.stubGlobal('fetch', vi.fn())
  })

  it('short-circuits to an empty array for an empty query, without calling auth or fetch', async () => {
    const res = await GET(makeRequest(''))
    expect(await res.json()).toEqual([])
    expect(auth).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 401 with an empty array when there is no session token', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await GET(makeRequest('DVL'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual([])
  })

  it('fans out to all 5 entities, including RealEstateProperty', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ list: [] }) } as never)
    await GET(makeRequest('DVL'))

    const calledEntities = vi.mocked(fetch).mock.calls.map(([url]) => new URL(url as string).pathname.split('/').pop())
    expect(calledEntities).toEqual(
      expect.arrayContaining(['Contact', 'RealEstateRequest', 'Account', 'EblaContractParty', 'RealEstateProperty']),
    )
  })

  it('uses title/propertyCode (never the absent `name`) as the display name for RealEstateProperty results', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const isProperty = (url as string).includes('RealEstateProperty')
      return {
        ok: true,
        json: async () => ({
          list: isProperty
            ? [{ id: 'prop-1', propertyCode: 'DVL68660', title: 'DVL68660' }]
            : [],
        }),
      } as never
    })

    const res = await GET(makeRequest('DVL'))
    const results = await res.json()
    expect(results).toEqual([{ id: 'prop-1', name: 'DVL68660', entityType: 'RealEstateProperty' }])
  })

  it('falls back through propertyCode, then id, when a RealEstateProperty result has no title', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => ({
      ok: true,
      json: async () => ({
        list: (url as string).includes('RealEstateProperty')
          ? [{ id: 'prop-2', propertyCode: 'ABC123' }, { id: 'prop-3' }]
          : [],
      }),
    } as never))

    const res = await GET(makeRequest('x'))
    const results: { id: string; name: string }[] = await res.json()
    expect(results.find(r => r.id === 'prop-2')?.name).toBe('ABC123')
    expect(results.find(r => r.id === 'prop-3')?.name).toBe('prop-3')
  })

  it('uses the real `name` field (not title/propertyCode) for every non-Property entity', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => ({
      ok: true,
      json: async () => ({
        list: (url as string).includes('/Contact') ? [{ id: 'c-1', name: 'Jane Doe' }] : [],
      }),
    } as never))

    const res = await GET(makeRequest('Jane'))
    const results = await res.json()
    expect(results).toEqual(expect.arrayContaining([{ id: 'c-1', name: 'Jane Doe', entityType: 'Contact' }]))
  })

  it('treats one entity\'s failed/erroring request as an empty result, without failing the whole search', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      if ((url as string).includes('/Account')) throw new Error('network blip')
      return { ok: true, json: async () => ({ list: [] }) } as never
    })

    const res = await GET(makeRequest('x'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('treats a non-ok upstream response as an empty result for that entity', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({}) } as never)
    const res = await GET(makeRequest('x'))
    expect(await res.json()).toEqual([])
  })
})
