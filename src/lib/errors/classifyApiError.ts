import axios from 'axios'
import type { ApiErrorKind, ClassifiedApiError } from './types'

// Default, entity-agnostic copy. Feature code overrides these per entity via
// presentApiError() — this module never mentions "property" or any other
// domain noun, so it stays reusable as-is by every future consumer.
const DEFAULT_MESSAGE: Record<ApiErrorKind, string> = {
  'permission-denied': 'You don’t have permission to do this. No changes were saved.',
  'auth-expired': 'Your session has expired. Redirecting to sign in…',
  'not-found': 'This record no longer exists — it may have been deleted. No changes were saved.',
  'conflict': 'This record was changed elsewhere since you opened it. Refresh and try again.',
  'validation': 'The server rejected some of the submitted information. Please review and try again.',
  'server-error': 'Something went wrong on our end. No changes were saved — please try again.',
  'network-timeout': 'The request timed out. No changes were saved — check your connection and try again.',
  'unknown': 'Something unexpected happened. No changes were saved.',
}

const RETRYABLE: Record<ApiErrorKind, boolean> = {
  'permission-denied': false,
  'auth-expired': false,
  'not-found': false,
  'conflict': true,
  'validation': false,
  'server-error': true,
  'network-timeout': true,
  'unknown': true,
}

const LOG_LEVEL: Record<ApiErrorKind, ClassifiedApiError['logLevel']> = {
  'permission-denied': 'warn',
  'auth-expired': 'warn',
  'not-found': 'warn',
  'conflict': 'warn',
  'validation': 'warn',
  'server-error': 'error',
  'network-timeout': 'error',
  'unknown': 'error',
}

function build(kind: ApiErrorKind, httpStatus: number | null, devDetail?: string): ClassifiedApiError {
  return {
    kind,
    httpStatus,
    message: DEFAULT_MESSAGE[kind],
    retryable: RETRYABLE[kind],
    logLevel: LOG_LEVEL[kind],
    devDetail,
  }
}

/**
 * Classifies any error thrown by an axiosClient call into one of the app's
 * known API error kinds. Framework-agnostic and entity-agnostic — safe to
 * call from any repository consumer or from FormFramework itself.
 *
 * Status-code notes, from live verification against this EspoCRM instance:
 *  - 403 on a real ACL rejection (e.g. edit:own on someone else's record)
 *    comes back with an EMPTY body and the actual reason in the
 *    `X-Status-Reason` header (confirmed live: "No edit access.") — the
 *    body is not a reliable source of detail for this status.
 *  - EspoCRM's real "required in practice, not in metadata" validation
 *    failures return 400, not 422 (confirmed live twice, on Document and
 *    Call creation) — both are classified as 'validation' here.
 */
export function classifyApiError(error: unknown): ClassifiedApiError {
  if (!axios.isAxiosError(error)) {
    return build('unknown', null, error instanceof Error ? error.message : undefined)
  }

  if (!error.response) {
    return build('network-timeout', null, error.code ?? error.message)
  }

  const status = error.response.status
  const reasonHeader = error.response.headers?.['x-status-reason'] as string | undefined
  const body = error.response.data as { reason?: string; field?: string } | undefined
  const devDetail = [reasonHeader, body?.reason, body?.field].filter(Boolean).join(' · ') || undefined

  switch (status) {
    case 401: return build('auth-expired', status, devDetail)
    case 403: return build('permission-denied', status, devDetail)
    case 404: return build('not-found', status, devDetail)
    case 409: return build('conflict', status, devDetail)
    case 400:
    case 422: return build('validation', status, devDetail)
    default:
      return status >= 500
        ? build('server-error', status, devDetail)
        : build('unknown', status, devDetail)
  }
}
