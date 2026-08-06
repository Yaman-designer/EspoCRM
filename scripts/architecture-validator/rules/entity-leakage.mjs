// Rule: entity leakage.
// Presentation components must receive a ViewModel, never the entity model
// directly — unless the file is listed in exceptions.json with a reason.

import fs from 'node:fs'
import path from 'node:path'
import { listFiles, getImports } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, EXCEPTIONS_FILE, REPO_ROOT } from '../config.mjs'

export const id = 'entity-leakage'
export const name = 'Entity leakage into presentation components'

function loadExceptions() {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_FILE, 'utf8'))
  return raw.entityLeakage ?? []
}

export function run() {
  const violations = []
  const staleExceptions = []
  const exceptions = loadExceptions()
  const exceptionFiles = new Set(exceptions.map(e => e.file))
  const matchedExceptionFiles = new Set()

  for (const featureRoot of FEATURE_ROOTS) {
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)
    const typesRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.types)

    // Discover the entity type name(s) declared in this feature's types/ (e.g. RealEstateProperty).
    const entityNames = discoverEntityNames(typesRoot)

    for (const file of listFiles(sectionsRoot)) {
      for (const imp of getImports(file)) {
        if (!/\/types\//.test(imp.specifier)) continue
        for (const n of imp.namedImports) {
          if (!entityNames.has(n.name)) continue
          if (exceptionFiles.has(file)) {
            matchedExceptionFiles.add(file)
            continue // documented, approved — not a violation
          }
          violations.push({
            file, line: imp.line,
            message: `Imports entity model '${n.name}' directly. Presentational components take a ViewModel — build one in the container, or add a documented exception to exceptions.json if this component genuinely owns async data fetching.`,
          })
        }
      }
    }
  }

  // A documented exception whose file no longer actually imports the
  // entity model is stale — the CI-integration requirement explicitly
  // calls out "a documented exception changes" as something that must be
  // caught, not silently ignored either direction.
  for (const file of exceptionFiles) {
    if (!matchedExceptionFiles.has(file)) {
      staleExceptions.push({
        file, line: 0,
        message: `Listed in exceptions.json as an entity-leakage exception, but no longer imports the entity model — the exception is stale. Remove it from exceptions.json (or investigate why the expected import disappeared).`,
      })
    }
  }

  return { id, name, violations, warnings: staleExceptions, exceptionsApplied: [...matchedExceptionFiles] }
}

function discoverEntityNames(typesRoot) {
  const names = new Set()
  for (const file of listFiles(typesRoot)) {
    const text = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8')
    const matches = text.matchAll(/export interface (\w+)\s*\{/g)
    for (const m of matches) {
      // Heuristic: the feature's core entity interface is the largest
      // exported interface in types/ — but to keep this rule dependency-free
      // and exact, we treat every exported interface as a candidate entity
      // EXCEPT small ref/DTO shapes (those ending in "Ref", "Filters",
      // "Option") which are intentionally allowed through to components.
      if (!/(Ref|Filters|Option|Range|View)$/.test(m[1])) names.add(m[1])
    }
  }
  return names
}
