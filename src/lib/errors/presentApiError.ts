import { toast } from 'sonner'
import { classifyApiError } from './classifyApiError'
import type { ApiErrorKind, ClassifiedApiError } from './types'

export interface ApiErrorPresentationOptions {
  /** Lowercase singular noun, e.g. "property", "contact" — used to phrase entity-aware messages. */
  entityLabel: string
  /** Re-runs the same request unmodified. Only ever offered for retryable kinds. */
  onRetry?: () => void
  /** Navigates the user away from a record they can't act on further here (permission-denied, not-found). */
  onRecover?: () => void
  recoveryLabel?: string
}

// Entity-aware overrides — only for the kinds where a generic message would
// be too vague to act on. Every other kind falls back to classifyApiError's
// already-honest generic message. Adding a new consumer never requires
// touching this map; it only grows if a *kind* needs entity-aware phrasing.
const ENTITY_MESSAGE: Partial<Record<ApiErrorKind, (entity: string) => string>> = {
  'permission-denied': (entity) =>
    `You don’t have permission to change this ${entity} — it may belong to another agent. No changes were saved.`,
  'not-found': (entity) =>
    `This ${entity} no longer exists — it may have been deleted. No changes were saved.`,
  'conflict': (entity) =>
    `This ${entity} was changed elsewhere since you opened it. Refresh and try again.`,
}

/**
 * Classifies a failed API call, logs it at the right severity, and shows the
 * one toast the user actually sees — with an entity-aware message and, when
 * applicable, a single recovery action (retry, or navigate away). Returns
 * the classification so a caller can additionally drive its own UI state
 * (e.g. FormFramework's SaveState) from the same result.
 *
 * This is the one place permission/error copy for a submit flow should live
 * — feature code passes an entityLabel, it never re-implements status-code
 * branching itself.
 */
export function presentApiError(error: unknown, options: ApiErrorPresentationOptions): ClassifiedApiError {
  const classified = classifyApiError(error)
  const baseMessage = ENTITY_MESSAGE[classified.kind]?.(options.entityLabel) ?? classified.message
  // 'validation' is the one kind where the server's own reason (EspoCRM's
  // X-Status-Reason header, or a reason/field in the response body — see
  // classifyApiError's devDetail) is genuinely actionable for the user, not
  // just for the console: e.g. a propertyCode uniqueness race (passes the
  // client-side async check, then a second user claims it before this
  // user's own submit lands) previously surfaced only the generic "some of
  // the submitted information was rejected," with no way to tell which
  // field or why. Every other kind keeps its existing message unchanged.
  const message = classified.kind === 'validation' && classified.devDetail
    ? `${baseMessage} (${classified.devDetail})`
    : baseMessage

  if (classified.logLevel === 'error') {
    console.error('[api-error]', classified.kind, classified.httpStatus, classified.devDetail, error)
  } else {
    console.warn('[api-error]', classified.kind, classified.httpStatus, classified.devDetail)
  }

  const action = classified.retryable && options.onRetry
    ? { label: 'Try again', onClick: options.onRetry }
    : !classified.retryable && options.onRecover
      ? { label: options.recoveryLabel ?? 'Go back', onClick: options.onRecover }
      : undefined

  toast.error(message, action ? { action } : undefined)

  return classified
}
