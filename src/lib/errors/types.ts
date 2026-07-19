// Reusable, entity-agnostic classification of any failed API call — the
// single vocabulary every feature (Property today, Contacts/Requests/
// Accounts/Contracts tomorrow) classifies its errors into. New consumers
// add an entityLabel via presentApiError(), never a new kind here.

export type ApiErrorKind =
  | 'permission-denied'  // 403 — EspoCRM entity/field ACL rejected the request
  | 'auth-expired'       // 401 — session no longer valid
  | 'not-found'          // 404 — record doesn't exist (deleted, bad id)
  | 'conflict'           // 409 — record changed since it was read
  | 'validation'         // 400/422 — EspoCRM rejected the payload (see note below)
  | 'server-error'       // 5xx
  | 'network-timeout'    // request never reached the server / timed out
  | 'unknown'

export interface ClassifiedApiError {
  kind: ApiErrorKind
  httpStatus: number | null
  /** Generic, entity-agnostic message — safe to show as-is or override per entity. */
  message: string
  /** Whether re-submitting the same request, unmodified, could plausibly succeed. */
  retryable: boolean
  logLevel: 'warn' | 'error'
  /** Server-supplied detail (EspoCRM's X-Status-Reason header, or body.reason/field) — developer-facing only. */
  devDetail?: string
}
