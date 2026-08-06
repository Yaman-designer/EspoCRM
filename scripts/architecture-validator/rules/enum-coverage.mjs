// Rule: enum coverage.
//
// Scope, stated honestly: this checks every literal-union "enum" type
// exported from the entity's types file that has at least one dedicated
// presentation mapper in lib/mappers/ (today: PropertyStatus, mapped by
// status-presentation.ts's three functions). It reports which literal
// values are never explicitly compared/keyed in that mapper — they
// silently fall through to that function's default branch. This is a real,
// useful, machine-checked signal, not a claim to auto-discover and validate
// every enum-shaped type in the codebase against every render path (a
// generic version of that would need the same field-level dataflow tooling
// field-coverage.mjs's own doc comment declines to fake).

import path from 'node:path'
import fs from 'node:fs'
import { listFiles, getUnionTypeLiterals, getComparedStringLiterals } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, REPO_ROOT } from '../config.mjs'

export const id = 'enum-coverage'
export const name = 'Enum coverage in dedicated presentation mappers'

// entityType -> mapper file (relative to featureRoot) — extend this list
// if another entity field grows its own dedicated status-style mapper.
const MAPPED_ENUMS = [
  { typeName: 'PropertyStatus', mapperFile: 'lib/mappers/status-presentation.ts' },
]

function findTypesFile(typesRoot) {
  for (const file of listFiles(typesRoot)) {
    const text = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8')
    if (/export type PropertyStatus\b/.test(text)) return file
  }
  return null
}

export function run() {
  const violations = []
  const warnings = []

  for (const featureRoot of FEATURE_ROOTS) {
    const typesRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.types)
    const typesFile = findTypesFile(typesRoot)
    if (!typesFile) continue

    for (const { typeName, mapperFile } of MAPPED_ENUMS) {
      const mapperPath = path.posix.join(featureRoot, mapperFile)
      if (!fs.existsSync(path.join(REPO_ROOT, mapperPath))) {
        warnings.push({ file: mapperPath, line: 0, message: `Declared mapper for '${typeName}' does not exist — update MAPPED_ENUMS in enum-coverage.mjs.` })
        continue
      }

      const literals = getUnionTypeLiterals(typesFile, typeName)
      const handled = getComparedStringLiterals(mapperPath)
      const unhandled = [...literals].filter(v => !handled.has(v)).sort()

      for (const value of unhandled) {
        violations.push({
          file: mapperPath, line: 0,
          message: `'${typeName}' value '${value}' is never explicitly compared or keyed in ${mapperFile} — it silently falls through to that function's default branch. Add an explicit case (even if the intended treatment matches the default) so a status added later can't silently inherit the wrong bucket.`,
        })
      }

      warnings.push({
        file: mapperPath, line: 0,
        message: `${typeName}: ${literals.size - unhandled.length}/${literals.size} values explicitly handled in ${mapperFile}.`,
      })
    }
  }

  return { id, name, violations, warnings }
}
