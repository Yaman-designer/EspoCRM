import type { RegisterOptions } from 'react-hook-form'
import type { FieldSchema } from './types'
import { evaluateCondition } from './VisibilityEngine'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/
const PHONE_RE = /^[+]?[\d\s\-()]{7,}$/

type GetValues = () => Record<string, unknown>

// Dedupes a `type: 'async'` validator call for a value it has already
// checked — e.g. identity-governance.schema.ts's propertyCode uniqueness
// check, which used to fire a live GET request on every single "Continue"
// click on step 1 (once the user had typed a code), even when the value
// hadn't changed since the previous click. Keyed by the validate function's
// own identity (not the field key): each schema field builds its `validate`
// closure fresh per wizard session (see buildIdentityGovernanceStep, memoized
// in PropertyFormPage.tsx), so a WeakMap on that closure naturally scopes the
// cache to the session that created it — a create-mode check and an
// edit-mode check (which excludes the record's own id) never share a cache
// bucket, without ValidationEngine needing to know anything about
// currentPropertyId or any other context baked into the closure.
const asyncValidationCache = new WeakMap<
  (value: unknown) => Promise<boolean | string>,
  Map<string, Promise<boolean | string>>
>()

/**
 * Converts a field's `required` flag + `validation` array into react-hook-form
 * RegisterOptions compatible with both `register()` and `<Controller rules={} />`.
 */
export function buildRules(field: FieldSchema, getValues?: GetValues): RegisterOptions {
  const rules: RegisterOptions = {}
  const validates: Record<string, (val: unknown) => string | boolean | Promise<string | boolean>> = {}

  if (field.required) {
    rules.required = 'This field is required'
  }

  // requiredWhen is sugar over the existing 'custom' validator machinery —
  // reuses evaluateCondition rather than a second condition-evaluation path.
  if (field.requiredWhen) {
    const cond = field.requiredWhen
    const message = (field.meta?.requiredWhenMessage as string | undefined) ?? 'This field is required'
    validates.vld_requiredWhen = (val) => {
      const all = getValues?.() ?? {}
      if (!evaluateCondition(cond, all)) return true
      const isEmpty = val === undefined || val === null || val === '' ||
        (Array.isArray(val) && val.length === 0)
      return !isEmpty || message
    }
  }

  for (const [i, rule] of (field.validation ?? []).entries()) {
    switch (rule.type) {
      case 'required':
        rules.required = rule.message ?? 'This field is required'
        break

      case 'min':
        rules.min = { value: rule.value, message: rule.message ?? `Minimum value is ${rule.value}` }
        break

      case 'max':
        rules.max = { value: rule.value, message: rule.message ?? `Maximum value is ${rule.value}` }
        break

      case 'minLength':
        rules.minLength = {
          value: rule.value,
          message: rule.message ?? `At least ${rule.value} characters required`,
        }
        break

      case 'maxLength':
        rules.maxLength = {
          value: rule.value,
          message: rule.message ?? `Maximum ${rule.value} characters`,
        }
        break

      case 'pattern':
        rules.pattern = {
          value: rule.regex instanceof RegExp ? rule.regex : new RegExp(rule.regex),
          message: rule.message ?? 'Invalid format',
        }
        break

      case 'email':
        validates[`vld_email_${i}`] = (val) =>
          !val || EMAIL_RE.test(String(val)) || (rule.message ?? 'Invalid email address')
        break

      case 'url':
        validates[`vld_url_${i}`] = (val) =>
          !val || URL_RE.test(String(val)) || (rule.message ?? 'Invalid URL — must start with http(s)://')
        break

      case 'phone':
        validates[`vld_phone_${i}`] = (val) =>
          !val || PHONE_RE.test(String(val)) || (rule.message ?? 'Invalid phone number')
        break

      case 'custom':
        validates[`vld_custom_${i}`] = async (val) => {
          const all = getValues?.() ?? {}
          const result = await rule.validate(val, all)
          if (typeof result === 'string') return result
          return result || 'Validation failed'
        }
        break

      case 'async': {
        const validateFn = rule.validate
        validates[`vld_async_${i}`] = (val) => {
          const cacheKey = JSON.stringify(val)
          let cache = asyncValidationCache.get(validateFn)
          if (!cache) {
            cache = new Map()
            asyncValidationCache.set(validateFn, cache)
          }
          const cached = cache.get(cacheKey)
          if (cached) return cached

          const outcome = (async () => {
            const result = await validateFn(val)
            if (typeof result === 'string') return result
            return result || 'Validation failed'
          })()
          cache.set(cacheKey, outcome)
          // A network/unexpected failure shouldn't permanently poison the
          // cache for this value — evict so the next attempt retries for
          // real. A resolved "taken"/"available" outcome stays cached.
          outcome.catch(() => cache!.delete(cacheKey))
          return outcome
        }
        break
      }
    }
  }

  if (Object.keys(validates).length) {
    rules.validate = validates
  }

  return rules
}

/**
 * Returns a human-readable summary of the validation constraints
 * (used in FieldWrapper as a11y `aria-description` hint).
 */
export function getValidationHint(field: FieldSchema): string | undefined {
  const hints: string[] = []
  if (field.required) hints.push('Required')
  for (const rule of field.validation ?? []) {
    if (rule.type === 'minLength') hints.push(`Min ${rule.value} chars`)
    if (rule.type === 'maxLength') hints.push(`Max ${rule.value} chars`)
    if (rule.type === 'min') hints.push(`Min ${rule.value}`)
    if (rule.type === 'max') hints.push(`Max ${rule.value}`)
  }
  return hints.length ? hints.join(' · ') : undefined
}
