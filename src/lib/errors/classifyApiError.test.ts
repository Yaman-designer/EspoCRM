import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { classifyApiError } from './classifyApiError'

// Every shape below is either a real, live-captured response from this
// EspoCRM instance (see the GAP-25 Certification Report) or the documented
// standard semantic for a status this session could not safely force
// against the shared staging server (409/5xx/network-timeout).
function makeAxiosError(status: number, data: unknown, headers: Record<string, string> = {}): AxiosError {
  const err = new AxiosError(`Request failed with status code ${status}`)
  err.response = {
    status,
    data,
    statusText: '',
    headers: new AxiosHeaders(headers),
    config: {} as never,
  }
  return err
}

describe('classifyApiError', () => {
  it('classifies a real entity-level ACL 403 as permission-denied, not retryable', () => {
    // Live-captured shape through this app's own /api/espo proxy: empty
    // body, no X-Status-Reason header (the proxy drops response headers).
    const result = classifyApiError(makeAxiosError(403, undefined, {}))
    expect(result.kind).toBe('permission-denied')
    expect(result.retryable).toBe(false)
    expect(result.devDetail).toBeUndefined()
  })

  it('captures X-Status-Reason as devDetail when calling EspoCRM directly (header present)', () => {
    const result = classifyApiError(makeAxiosError(403, undefined, { 'x-status-reason': 'No edit access.' }))
    expect(result.kind).toBe('permission-denied')
    expect(result.devDetail).toBe('No edit access.')
  })

  it('classifies 401 as auth-expired, not retryable', () => {
    const result = classifyApiError(makeAxiosError(401, undefined))
    expect(result.kind).toBe('auth-expired')
    expect(result.retryable).toBe(false)
  })

  it('classifies 404 as not-found, not retryable', () => {
    expect(classifyApiError(makeAxiosError(404, undefined)).kind).toBe('not-found')
  })

  it('classifies 409 as conflict, retryable', () => {
    const result = classifyApiError(makeAxiosError(409, undefined))
    expect(result.kind).toBe('conflict')
    expect(result.retryable).toBe(true)
  })

  it('classifies EspoCRM\'s real 400 validationFailure shape as validation, not retryable', () => {
    // Live-confirmed pattern (Wave 7/EC-8, Document + Call creation):
    // EspoCRM uses 400, not 422, for "required in practice" failures.
    const result = classifyApiError(
      makeAxiosError(400, { reason: 'validationFailure', field: 'assignedUser' }),
    )
    expect(result.kind).toBe('validation')
    expect(result.retryable).toBe(false)
    expect(result.devDetail).toBe('validationFailure · assignedUser')
  })

  it('also classifies the canonical 422 status as validation', () => {
    expect(classifyApiError(makeAxiosError(422, undefined)).kind).toBe('validation')
  })

  it('classifies any other 5xx as server-error, retryable', () => {
    const result = classifyApiError(makeAxiosError(500, undefined))
    expect(result.kind).toBe('server-error')
    expect(result.retryable).toBe(true)
  })

  it('classifies an unrecognized 4xx as unknown', () => {
    expect(classifyApiError(makeAxiosError(418, undefined)).kind).toBe('unknown')
  })

  it('classifies a response-less axios error (no network reply) as network-timeout', () => {
    const err = new AxiosError('timeout of 5000ms exceeded')
    err.code = 'ECONNABORTED'
    const result = classifyApiError(err)
    expect(result.kind).toBe('network-timeout')
    expect(result.retryable).toBe(true)
    expect(result.devDetail).toBe('ECONNABORTED')
  })

  it('classifies a non-axios error as unknown without throwing', () => {
    expect(classifyApiError(new Error('boom')).kind).toBe('unknown')
    expect(classifyApiError('a plain string').kind).toBe('unknown')
    expect(classifyApiError(undefined).kind).toBe('unknown')
  })

  it('every kind has a non-empty, entity-agnostic message', () => {
    const statuses = [401, 403, 404, 409, 400, 500] as const
    for (const status of statuses) {
      const { message } = classifyApiError(makeAxiosError(status, undefined))
      expect(message.length).toBeGreaterThan(0)
      expect(message).not.toMatch(/property|contact|account|request/i)
    }
  })
})
