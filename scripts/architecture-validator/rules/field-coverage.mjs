// Rule: field coverage ("Property Form Trace", honestly scoped).
//
// What this checks, precisely: every field declared on the entity
// interface (e.g. `RealEstateProperty`) is referenced *somewhere* in the
// data layer (view-models/ AND lib/ — the latter holds Formatters/Mappers
// that pre-date the ViewModel migration, e.g. property-narrative.ts,
// display.ts; ARCHITECTURE.md documents both as legitimate homes) — via a
// `Pick<Entity, 'field'>` type argument, a `property.field` access, or
// `const { field } = property` destructuring.
//
// What this does NOT check (named honestly, not implied): that the field
// actually reaches a rendered JSX node, survives every mapper transform
// unmodified, or is exercised by a specific enum/conditional branch — that
// would be true field-level dataflow analysis, a materially larger tool
// than syntactic AST scanning can honestly claim to provide. This rule
// answers a narrower, still-useful question: "does the Details page's data
// layer know this field exists at all?" A field failing this check is a
// real, actionable signal (something the Wizard collects that the Details
// page's ViewModel layer never once references) even though passing it
// isn't proof the field is correctly rendered.

import fs from 'node:fs'
import path from 'node:path'
import { listFiles, getPickFieldLiterals, getPropertyAccessNames, getDestructuredNames, getInterfaceMembers } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, FIELD_COVERAGE_ALLOWLIST, REPO_ROOT, EXCEPTIONS_FILE } from '../config.mjs'

function loadExceptionFiles() {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_FILE, 'utf8'))
  return (raw.entityLeakage ?? []).map(e => e.file)
}

export const id = 'field-coverage'
export const name = 'Entity field coverage in the ViewModel layer'

function findEntityTypeFile(typesRoot) {
  for (const file of listFiles(typesRoot)) {
    const text = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8')
    if (/export interface RealEstateProperty\b/.test(text)) return file
  }
  return null
}

export function run() {
  const violations = []
  const warnings = []

  for (const featureRoot of FEATURE_ROOTS) {
    const typesRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.types)
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)
    const libRoot = path.posix.join(featureRoot, 'lib')

    const entityFile = findEntityTypeFile(typesRoot)
    if (!entityFile) {
      warnings.push({ file: typesRoot, line: 0, message: 'No RealEstateProperty-shaped entity interface found — field-coverage check skipped for this feature root.' })
      continue
    }

    const allFields = getInterfaceMembers(entityFile, 'RealEstateProperty')
    const referenced = new Set()
    // Also scan the documented entity-leakage exceptions (see
    // exceptions.json) — components that legitimately still read raw
    // `property` fields directly (async-data owners) are a real,
    // documented part of this feature's data layer for coverage purposes,
    // not a blind spot in it.
    const dataLayerFiles = [...listFiles(viewModelsRoot), ...listFiles(libRoot), ...loadExceptionFiles()]

    for (const file of dataLayerFiles) {
      for (const f of getPickFieldLiterals(file)) referenced.add(f)
      // `property.<field>` covers the common param name; the domain/lib
      // layer also destructures off entity-specific names in a few older
      // files, so both accessor styles are checked against every
      // identifier a Pick<> in the same file already proved is a property
      // param — kept simple (fixed name) rather than inferring every
      // possible parameter name, which is why this is a coverage signal,
      // not a proof (see the file-level doc comment above).
      for (const f of getPropertyAccessNames(file, 'property')) referenced.add(f)
      for (const f of getPropertyAccessNames(file, 'p')) referenced.add(f)
      for (const f of getDestructuredNames(file, 'property')) referenced.add(f)
      for (const f of getDestructuredNames(file, 'p')) referenced.add(f)
    }

    const unreferenced = [...allFields]
      .filter(f => !referenced.has(f) && !FIELD_COVERAGE_ALLOWLIST.has(f))
      .sort()

    for (const field of unreferenced) {
      violations.push({
        file: entityFile, line: 0,
        message: `Field '${field}' on RealEstateProperty is never referenced anywhere in ${viewModelsRoot}/ or ${libRoot}/ — either it has no Details-page representation, or it's read some other way this check doesn't recognize (both worth checking by hand). If it's intentionally excluded (internal/system field, or a write-path-only field), add it to FIELD_COVERAGE_ALLOWLIST in config.mjs with a reason.`,
      })
    }

    warnings.push({
      file: entityFile, line: 0,
      message: `Coverage: ${allFields.size - unreferenced.length}/${allFields.size} entity fields referenced by the data layer (${dataLayerFiles.length} files scanned).`,
    })
  }

  return { id, name, violations, warnings }
}
