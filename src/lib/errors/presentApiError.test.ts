import { describe, it, expect, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { toast } from 'sonner'
import { presentApiError } from './presentApiError'

vi.mock('sonner')

function makeAxiosError(status: number, data: unknown = undefined): AxiosError {
  const err = new AxiosError(`Request failed with status code ${status}`)
  err.response = { status, data, statusText: '', headers: new AxiosHeaders(), config: {} as never }
  return err
}

// sonner's real Action type union (Action | ReactNode) doesn't narrow
// cleanly from a mock call's inferred arg type — read it through `unknown`
// once, here, instead of an awkward double-cast at every call site.
function getAction(options: unknown): { label: string; onClick: () => void } | undefined {
  return (options as { action?: { label: string; onClick: () => void } } | undefined)?.action
}

describe('presentApiError', () => {
  it('shows an entity-aware "another agent" message for a permission-denied error', () => {
    presentApiError(makeAxiosError(403), { entityLabel: 'property' })

    expect(toast.error).toHaveBeenCalledTimes(1)
    const [message] = vi.mocked(toast.error).mock.calls[0]
    expect(message).toMatch(/property/i)
    expect(message).toMatch(/another agent/i)
    expect(message).toMatch(/no changes were saved/i)
  })

  it('substitutes a different entityLabel without touching the classifier', () => {
    presentApiError(makeAxiosError(404), { entityLabel: 'contact' })
    const [message] = vi.mocked(toast.error).mock.calls[0]
    expect(message).toMatch(/contact/i)
  })

  it('offers a "Try again" action for a retryable kind when onRetry is supplied', () => {
    const onRetry = vi.fn()
    presentApiError(makeAxiosError(500), { entityLabel: 'property', onRetry })

    const [, options] = vi.mocked(toast.error).mock.calls[0]
    const action = getAction(options)
    expect(action).toBeTruthy()
    expect(action?.label).toBe('Try again')
    action?.onClick()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('offers a recovery action instead of retry for a non-retryable kind when onRecover is supplied', () => {
    const onRecover = vi.fn()
    presentApiError(makeAxiosError(403), {
      entityLabel: 'property',
      onRetry: vi.fn(), // must be ignored — permission-denied is not retryable
      onRecover,
      recoveryLabel: 'Back to properties',
    })

    const [, options] = vi.mocked(toast.error).mock.calls[0]
    expect(getAction(options)?.label).toBe('Back to properties')
  })

  it('shows no action at all when neither onRetry nor onRecover applies', () => {
    presentApiError(makeAxiosError(403), { entityLabel: 'property' })
    const [, options] = vi.mocked(toast.error).mock.calls[0]
    expect(options).toBeUndefined()
  })

  it('returns the classification so callers can drive additional UI state', () => {
    const result = presentApiError(makeAxiosError(403), { entityLabel: 'property' })
    expect(result.kind).toBe('permission-denied')
    expect(result.httpStatus).toBe(403)
  })
})
