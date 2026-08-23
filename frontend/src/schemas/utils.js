/**
 * Shared helpers for zod-based form validation.
 */
import { z } from 'zod'

/**
 * Preprocess empty strings / null to undefined so `required`-style errors
 * fire instead of coercion producing 0.
 */
export function requiredNumber(message) {
  return z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ message }),
  )
}

/**
 * Flatten a SafeParseError into a { "path.to.field": message } object,
 * keeping the first message per field (matches existing form error UI).
 */
export function toFieldErrors(zodError) {
  const out = {}
  for (const issue of zodError.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
