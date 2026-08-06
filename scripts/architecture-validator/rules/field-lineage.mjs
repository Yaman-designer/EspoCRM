// Rule: field lineage report (the honest "semantic graph").
//
// Not a pass/fail gate — a generated report chaining together what the
// other semantic rules already proved: entity field → ViewModel output key
// (via semantic.mjs's intra-procedural trace) → consuming component (via
// the same naming-convention resolution viewmodel-consumption.mjs uses).
// This is real provenance data, not a claim of full field-to-DOM lineage —
// see README.md's "Semantic scope" section for exactly where the proven
// chain stops (at the ViewModel→component boundary, not inside JSX).

import path from 'node:path'
import { listFiles, getComponentViewModelPropTypeName } from '../ast.mjs'
import { traceViewModelBuilders } from '../semantic.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS } from '../config.mjs'

export const id = 'field-lineage'
export const name = 'Field lineage report (informational)'

export function buildLineageGraph() {
  const graph = []

  for (const featureRoot of FEATURE_ROOTS) {
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)

    // Which component consumes which ViewModel interface (each component
    // resolves to at most one — its actual `viewModel`/`data` prop type).
    const consumersByViewModel = new Map() // typeName -> [componentFile]
    for (const componentFile of listFiles(sectionsRoot)) {
      const typeName = getComponentViewModelPropTypeName(componentFile)
      if (!typeName) continue
      if (!consumersByViewModel.has(typeName)) consumersByViewModel.set(typeName, [])
      consumersByViewModel.get(typeName).push(componentFile)
    }

    for (const file of listFiles(viewModelsRoot)) {
      for (const builder of traceViewModelBuilders(file)) {
        // Best-effort: the interface this builder returns is the one
        // declared in the same file whose name the function's own name
        // implies (`buildXViewModel` -> `XViewModel`), when present.
        const impliedTypeName = builder.functionName.replace(/^build/, '').replace(/^./, c => c.toUpperCase())
        const consumers = consumersByViewModel.get(impliedTypeName) ?? []

        for (const field of builder.fields) {
          graph.push({
            entityField: field.field ?? null,
            transform: field.kind === 'formatted' ? field.formatter : (field.kind === 'direct' ? null : '(derived — multi-field or computed)'),
            viewModelFile: file,
            viewModelKey: field.key,
            kind: field.kind,
            consumers,
          })
        }
      }
    }
  }

  return graph
}

export function run() {
  const graph = buildLineageGraph()
  const direct = graph.filter(g => g.kind === 'direct').length
  const formatted = graph.filter(g => g.kind === 'formatted').length
  const derived = graph.filter(g => g.kind === 'derived').length
  const unconsumed = graph.filter(g => g.consumers.length === 0)

  const warnings = [
    { file: '(report)', line: 0, message: `Traced ${graph.length} ViewModel output fields: ${direct} direct field mappings, ${formatted} formatter-wrapped mappings, ${derived} multi-field/computed (not further traced — see semantic.mjs's own scope note).` },
  ]
  if (unconsumed.length > 0) {
    warnings.push({ file: '(report)', line: 0, message: `${unconsumed.length} traced fields belong to a ViewModel this scan found no naming-convention-matched component consumer for (may be a resolution gap in this report, not necessarily orphaned — see viewmodel-consumption.mjs for the authoritative orphan check).` })
  }

  return { id, name, violations: [], warnings, graph }
}
