import type { RegisterOptions } from 'react-hook-form'
import type { FieldSchema } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/
const PHONE_RE = /^[+]?[\d\s\-()]{7,}$/

type GetValues = () => Record<string, unknown>

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

      case 'async':
        validates[`vld_async_${i}`] = async (val) => {
          const result = await rule.validate(val)
          if (typeof result === 'string') return result
          return result || 'Validation failed'
        }
        break
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
