// Rule: JSX render consumption — the Phase-1/2 extension past the
// ViewModel boundary. `viewmodel-consumption.mjs` proves a field is
// *referenced somewhere in the component file* (destructured or accessed);
// this rule proves the strictly stronger claim that it's referenced
// *inside an actual JSX expression slot* — a field read only by
// non-rendering logic (a stray computation, a console.log, a comparison
// that never feeds JSX) would pass the older rule but fail this one.
//
// Two checks:
//  1. Top-level ViewModel fields reach a JSX expression container/attribute,
//     resolved through at most one local-alias hop (e.g. `visibleEvents =
//     expanded ? events : events.slice(...)` — `events` is genuinely
//     JSX-reachable via that one hop, not directly).
//  2. For array-typed fields whose element type is itself a known ViewModel
//     shape declared in the same file (e.g. `events: TimelineEventViewModel[]`),
//     which of THAT type's own fields are used inside the `.map()`
//     callback's JSX — the nested-element check field-coverage.mjs and
//     viewmodel-consumption.mjs both explicitly declined to build.
//
// Proof boundary (stated here, not just in README, since this is the rule
// where it matters most): "reaches a JSX expression slot" is proven. What
// happens after — whether that slot is inside a real DOM-producing element
// vs. passed into a child/shared component that then does something else
// with it, whether a surrounding `{cond && ...}` is ever truthy for real
// data, whether a third-party component (Radix, MapLibre, next/image)
// actually paints it — is NOT proven by this rule. See
// primitive-prop-consumption.mjs for the one additional inter-procedural
// hop this validator does take (into this framework's OWN shared
// primitives), and README.md's "Proof boundary" section for where it
// stops for good and why.

import path from 'node:path'
import {
  listFiles, getExportedShapes, getComponentViewModelPropTypeName, getInterfaceArrayMemberElementTypes,
} from '../ast.mjs'
import {
  traceJsxReachableIdentifiers, traceMappedElementFields, resolveLocalAliasIdentifiers, getDestructureRenameMap,
} from '../jsx-provenance.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS } from '../config.mjs'

export const id = 'jsx-render-consumption'
export const name = 'JSX render consumption (field reaches an actual JSX slot)'

/** Expands `identifiers` by one local-alias hop each, so an alias like `visibleEvents` also counts its resolved source (`events`) as reachable. */
function expandOneAliasHop(fileRel, identifiers) {
  const expanded = new Set(identifiers)
  for (const id of identifiers) {
    for (const resolved of resolveLocalAliasIdentifiers(fileRel, id)) expanded.add(resolved)
  }
  return expanded
}

export function run() {
  const violations = []
  const warnings = []

  for (const featureRoot of FEATURE_ROOTS) {
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)

    const declared = new Map() // typeName -> { file, fields }
    for (const file of listFiles(viewModelsRoot)) {
      for (const shape of getExportedShapes(file)) {
        if (/ViewModel$/.test(shape.name) && !declared.has(shape.name)) declared.set(shape.name, { file, fields: shape.fields })
      }
    }

    for (const componentFile of listFiles(sectionsRoot)) {
      const typeName = getComponentViewModelPropTypeName(componentFile)
      if (!typeName) continue
      const decl = declared.get(typeName)
      if (!decl) continue

      const { identifiers, mappedArrays } = traceJsxReachableIdentifiers(componentFile)
      const reachable = expandOneAliasHop(componentFile, identifiers)
      // Every mapped-array key (and what IT resolves to) also counts as reachable.
      for (const arrayKey of mappedArrays.keys()) {
        reachable.add(arrayKey)
        for (const resolved of resolveLocalAliasIdentifiers(componentFile, arrayKey)) reachable.add(resolved)
      }

      // A ViewModel key renamed on destructuring (`const { photoIds: allIds }
      // = viewModel`) is reachable under its RENAMED local name, not its
      // declared one — resolve both the `viewModel` and `data` destructuring
      // conventions this codebase uses.
      const renames = new Map([...getDestructureRenameMap(componentFile, 'viewModel'), ...getDestructureRenameMap(componentFile, 'data')])
      const isFieldReached = (field) => reachable.has(field) || (renames.has(field) && reachable.has(renames.get(field)))

      const notReached = decl.fields.filter(f => !isFieldReached(f)).sort()
      for (const field of notReached) {
        violations.push({
          file: componentFile, line: 0,
          message: `'${typeName}.${field}' never reaches a JSX expression slot in ${componentFile} (it may still be referenced elsewhere in the file — e.g. a computation — which is a weaker claim viewmodel-consumption.mjs already checks). If this field is meant to render, check it's actually placed in JSX; if it's genuinely not rendered, consider whether it belongs on this ViewModel at all.`,
        })
      }
      warnings.push({
        file: componentFile, line: 0,
        message: `${typeName}: ${decl.fields.length - notReached.length}/${decl.fields.length} top-level fields reach a JSX slot in ${componentFile}.`,
      })

      // Nested array-element check.
      const arrayElementTypes = getInterfaceArrayMemberElementTypes(decl.file, typeName)
      for (const [arrayField, elementTypeName] of arrayElementTypes) {
        const elementDecl = declared.get(elementTypeName)
        if (!elementDecl) continue // element type isn't itself a *ViewModel-declared shape this scan tracks (e.g. a plain string[] or a type from elsewhere)

        // Find which local alias (if any) actually gets .map()'d, resolving back to `arrayField`.
        let usedElementFields = new Set()
        let mapped = false
        for (const [mapKey, elementParam] of mappedArrays) {
          const resolvedIds = mapKey === arrayField ? new Set([arrayField]) : resolveLocalAliasIdentifiers(componentFile, mapKey)
          if (mapKey === arrayField || resolvedIds.has(arrayField)) {
            mapped = true
            for (const f of traceMappedElementFields(componentFile, mapKey, elementParam)) usedElementFields.add(f)
          }
        }
        if (!mapped) continue // arrayField itself isn't reached via any traced .map() — already covered by the top-level check above

        const elementNotReached = elementDecl.fields.filter(f => !usedElementFields.has(f)).sort()
        for (const field of elementNotReached) {
          violations.push({
            file: componentFile, line: 0,
            message: `'${elementTypeName}.${field}' (the element type of '${typeName}.${arrayField}') is never accessed inside ${componentFile}'s '.map()' callback over that array. Nested-array-element check — see this rule's own header comment for scope. If the field is passed whole-object to a helper function (e.g. 'resolveIcon(item)') rather than accessed as 'item.${field}' directly, this rule cannot see that use — a known, named blind spot, not a guaranteed defect.`,
          })
        }
      }
    }
  }

  return { id, name, violations, warnings }
}
