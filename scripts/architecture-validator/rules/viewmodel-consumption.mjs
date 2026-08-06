// Rule: ViewModel consumption ("ViewModel property never reaches
// rendering" / orphan ViewModel field).
//
// For every component in components/sections/, resolves the ONE ViewModel
// type it actually receives as its `viewModel`/`data` prop (via
// getComponentViewModelPropTypeName — resolved from the real parameter
// type, not by scanning for every `*ViewModel`-suffixed name anywhere in
// the file, which would also catch unrelated element/helper types like
// `TimelineEventViewModel` used only for a `.map()` callback's parameter
// type and produce false positives on fields that really are consumed,
// just under a different local variable name — an earlier version of this
// rule made exactly that mistake; see ast.mjs's own note on the function).
// Then checks that every top-level member of that ONE interface is
// actually destructured or accessed by the component.
//
// Scope, honestly stated: top-level interface members only, and only the
// resolved prop-type interface — a field whose value is itself an array of
// objects (e.g. `detailClusters: FinancialDetailCluster[]`) is checked for
// whether `detailClusters` itself is consumed, not whether every nested
// field inside each array element is (that would need the same recursive,
// callback-parameter-aware tracing field-coverage.mjs's own doc comment
// also declines to fake).

import path from 'node:path'
import { listFiles, getExportedShapes, getComponentViewModelPropTypeName, getDestructuredNames, getPropertyAccessNames } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS } from '../config.mjs'

export const id = 'viewmodel-consumption'
export const name = 'ViewModel field consumption (orphan field detection)'

export function run() {
  const violations = []
  const warnings = []

  for (const featureRoot of FEATURE_ROOTS) {
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)

    // interfaceName -> { file, fields } for every exported *ViewModel shape.
    const declared = new Map()
    for (const file of listFiles(viewModelsRoot)) {
      for (const shape of getExportedShapes(file)) {
        if (/ViewModel$/.test(shape.name) && !declared.has(shape.name)) {
          declared.set(shape.name, { file, fields: shape.fields })
        }
      }
    }

    for (const componentFile of listFiles(sectionsRoot)) {
      const typeName = getComponentViewModelPropTypeName(componentFile)
      if (!typeName) continue
      const decl = declared.get(typeName)
      if (!decl) continue // resolved to a type this scan's view-models/ pass didn't declare — not this rule's concern (e.g. a type from another layer)

      const consumed = new Set([
        ...getDestructuredNames(componentFile, 'viewModel'),
        ...getDestructuredNames(componentFile, 'data'),
        ...getPropertyAccessNames(componentFile, 'viewModel'),
        ...getPropertyAccessNames(componentFile, 'data'),
      ])

      const orphaned = decl.fields.filter(m => !consumed.has(m)).sort()
      for (const field of orphaned) {
        violations.push({
          file: componentFile, line: 0,
          message: `'${typeName}.${field}' (declared in ${decl.file}) is never destructured or accessed in ${componentFile} — this ViewModel field has no rendering consumer. Either the component reads it under a different name (a real bug — the two would need to match), or the field is dead and should be removed from the interface.`,
        })
      }
      warnings.push({
        file: componentFile, line: 0,
        message: `${typeName}: ${decl.fields.length - orphaned.length}/${decl.fields.length} fields consumed by ${componentFile}.`,
      })
    }
  }

  return { id, name, violations, warnings }
}
