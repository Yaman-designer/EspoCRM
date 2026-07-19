// EspoCRM ACL shape, as returned inside the /App/user login response
// (userData.acl.data — confirmed by scripts/investigate-403.mjs, which reads
// this exact structure for its own diagnostic purposes). Each scope value is
// typically 'no' | 'own' | 'team' | 'all' (or a boolean in older EspoCRM
// versions) — kept loose here rather than a strict union since the exact
// value set is server-configured, not something this frontend controls.

export interface EspoAclScope {
  read?:   string | boolean
  create?: string | boolean
  edit?:   string | boolean
  delete?: string | boolean
  stream?: string | boolean
}

/** Keyed by EspoCRM entity/scope name, e.g. "RealEstateProperty". */
export type EspoAclData = Record<string, EspoAclScope>

/**
 * Conservative check: only treat an action as denied when EspoCRM explicitly
 * says so ('no' or false). 'own'/'team'/'all' (or an unrecognized value) are
 * treated as allowed at the UI-affordance level — this is a UX nicety, not a
 * security boundary; EspoCRM itself still enforces the real 403 server-side
 * regardless of what this returns.
 */
export function isAclActionDenied(
  acl: EspoAclData | undefined,
  entityType: string,
  action: keyof EspoAclScope,
): boolean {
  const value = acl?.[entityType]?.[action]
  return value === 'no' || value === false
}
