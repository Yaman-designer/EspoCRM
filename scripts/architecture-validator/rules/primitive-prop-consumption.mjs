// Rule: shared primitive prop consumption — the one inter-procedural hop
// this validator takes past the ViewModel/component boundary, and why it
// stops there (see Phase 5 / README.md's "Proof boundary" section for the
// full reasoning).
//
// A ViewModel field can reach a JSX slot in its own component (proven by
// jsx-render-consumption.mjs) by being handed to a SHARED PRIMITIVE as a
// prop — `<SectionHeader title={displayName} />`. Whether that primitive
// then actually renders it is a second, separate question this rule
// answers directly, because the set of shared primitives is small, closed,
// and owned by this same codebase (not an arbitrary external library) —
// unlike third-party components (Radix, MapLibre, next/image), where the
// same question would require reading and trusting someone else's source,
// which this validator does not attempt (see README.md).
//
// Scope: checks that every prop declared on a shared primitive's own props
// type is referenced inside THAT primitive's own JSX — the same
// JSX-reachability tracer used for ViewModel fields, applied one level
// deeper. Does not chain the two checks into a single combined proof
// (e.g. "ViewModel.title -> SectionHeader's title prop -> SectionHeader's
// own <h2>") — that composition is real and could be built, but doing it
// generically for arbitrary prop names (not just `viewModel`/`data`)
// crosses into a bigger prop-flow-tracing project; named as a real,
// buildable next step, not attempted here.

import ts from 'typescript'
import { listFiles, parse } from '../ast.mjs'
import { traceJsxReachableIdentifiers, resolveLocalAliasIdentifiers, getParameterDestructureRenameMap } from '../jsx-provenance.mjs'
import { SHARED_PRIMITIVES_ROOT } from '../config.mjs'

export const id = 'primitive-prop-consumption'
export const name = 'Shared primitive prop consumption'

function walk(node, visit) {
  visit(node)
  ts.forEachChild(node, child => walk(child, visit))
}

/** Every prop name declared on the component's own inline or named Props type, regardless of whether it ends in "ViewModel" (primitives take plain scalar/callback props, not ViewModels). */
function getComponentPropNames(fileRel) {
  const sf = parse(fileRel)
  const names = new Set()
  let propsTypeNode = null

  walk(sf, node => {
    if (propsTypeNode) return
    if (ts.isFunctionDeclaration(node) && node.parameters?.length && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      propsTypeNode = node.parameters[0].type ?? null
    }
  })
  if (!propsTypeNode) return names

  let members = null
  if (ts.isTypeLiteralNode(propsTypeNode)) {
    members = propsTypeNode.members
  } else if (ts.isTypeReferenceNode(propsTypeNode)) {
    const refName = propsTypeNode.typeName.getText(sf)
    walk(sf, node => {
      if (!members && ts.isInterfaceDeclaration(node) && node.name.text === refName) members = node.members
    })
  }
  if (!members) return names

  for (const m of members) {
    if (m.name && ts.isIdentifier(m.name)) names.add(m.name.text)
  }
  return names
}

export function run() {
  const violations = []
  const warnings = []

  for (const file of listFiles(SHARED_PRIMITIVES_ROOT)) {
    const props = getComponentPropNames(file)
    if (props.size === 0) continue

    const { identifiers } = traceJsxReachableIdentifiers(file)
    // Expand by one local-alias hop (e.g. `const initial = name.charAt(0)...`
    // then `{initial}` in JSX — `name` is reachable via that one hop) and
    // resolve parameter-destructuring renames (`{ icon: Icon }` — `icon` is
    // reachable under its renamed local `Icon`), same two resolutions
    // jsx-render-consumption.mjs applies to ViewModel fields.
    const reachable = new Set(identifiers)
    for (const id of identifiers) {
      for (const resolved of resolveLocalAliasIdentifiers(file, id)) reachable.add(resolved)
    }
    const renames = getParameterDestructureRenameMap(file)
    const isPropReached = (prop) => reachable.has(prop) || (renames.has(prop) && reachable.has(renames.get(prop)))

    const notReached = [...props].filter(p => !isPropReached(p)).sort()

    for (const prop of notReached) {
      violations.push({
        file, line: 0,
        message: `Prop '${prop}' is declared but never reaches a JSX slot inside ${file}'s own render output. A shared primitive with a dead prop either has unused API surface (remove it) or a real bug (it should be rendered but isn't).`,
      })
    }
    warnings.push({ file, line: 0, message: `${props.size - notReached.length}/${props.size} declared props reach JSX in ${file}.` })
  }

  return { id, name, violations, warnings }
}
