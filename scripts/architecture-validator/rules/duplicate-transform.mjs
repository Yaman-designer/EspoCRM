// Rule: duplicated transformation pipelines.
//
// Real, narrow, provable case: a ViewModel already formats an entity field
// with formatter F, producing output key K — then the presentational
// component calls F again on K itself. That's formatting an
// already-formatted value a second time (e.g. `formatDateGB(listedLabel)`
// where `listedLabel` is already `formatDateGB(createdAt)`'s output) —
// provable by matching the component's call-expression arguments against
// the exact ViewModel output key name, using the real provenance trace
// from semantic.mjs rather than guessing from field names.

import path from 'node:path'
import { listFiles, getCallExpressionsWithArgs, getComponentViewModelPropTypeName } from '../ast.mjs'
import { traceViewModelBuilders } from '../semantic.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS } from '../config.mjs'

export const id = 'duplicate-transform'
export const name = 'Duplicated transformation pipelines'

export function run() {
  const violations = []

  for (const featureRoot of FEATURE_ROOTS) {
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)

    // key -> formatter name, across every ViewModel builder.
    const formattedKeys = new Map()
    for (const file of listFiles(viewModelsRoot)) {
      for (const builder of traceViewModelBuilders(file)) {
        for (const f of builder.fields) {
          if (f.kind === 'formatted') formattedKeys.set(f.key, { formatter: f.formatter, file, sourceField: f.field })
        }
      }
    }

    for (const componentFile of listFiles(sectionsRoot)) {
      if (!getComponentViewModelPropTypeName(componentFile)) continue

      for (const call of getCallExpressionsWithArgs(componentFile)) {
        const arg0 = call.args[0]
        if (!arg0) continue
        // Match the argument's LEADING identifier, not just an exact
        // string match — real call sites commonly wrap the ViewModel key
        // in a fallback (`formatDateGB(listedLabel ?? '')`), which is
        // still the same double-formatting bug; an exact-string match
        // would miss it entirely (verified against a real injected case,
        // not assumed — see the self-validation log for this rule).
        const leadingIdentifier = arg0.match(/^[A-Za-z_$][\w$]*/)?.[0]
        const known = leadingIdentifier && formattedKeys.get(leadingIdentifier)
        if (known && known.formatter === call.name) {
          violations.push({
            file: componentFile, line: call.line,
            message: `Calls '${call.name}(${arg0})' — but '${leadingIdentifier}' is already the OUTPUT of '${known.formatter}(property.${known.sourceField})' inside ${known.file}. This formats the same value twice. Either the component should render '${leadingIdentifier}' directly, or the ViewModel shouldn't have pre-formatted it.`,
          })
        }
      }
    }
  }

  return { id, name, violations }
}
