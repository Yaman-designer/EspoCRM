// Rule: shared-layer isolation.
// Nothing under components/shared/ or shared/detail-view/ may import
// feature-specific code — not `features/`, not any per-entity vocabulary
// path, not a relative path that escapes into a features/ directory.

import { listFiles, getImports } from '../ast.mjs'
import { SHARED_PRIMITIVES_ROOT, SHARED_FRAMEWORK_ROOT } from '../config.mjs'

export const id = 'shared-isolation'
export const name = 'Shared layer isolation'

const FORBIDDEN_PATTERNS = [
  /\/features\//,
  /^@\/features\//,
  /\/entities\//,
  /\/properties\//, // catches both relative escapes and any stray '@/features/properties' spelling
]

export function run() {
  const violations = []

  for (const root of [SHARED_PRIMITIVES_ROOT, SHARED_FRAMEWORK_ROOT]) {
    for (const file of listFiles(root)) {
      for (const imp of getImports(file)) {
        if (FORBIDDEN_PATTERNS.some(p => p.test(imp.specifier))) {
          violations.push({
            file, line: imp.line,
            message: `Imports '${imp.specifier}' — shared framework code must be entity-agnostic. If this is genuinely needed, the code that needs it doesn't belong in ${root}.`,
          })
        }
      }
    }
  }

  return { id, name, violations }
}
