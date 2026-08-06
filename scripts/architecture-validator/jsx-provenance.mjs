// Architecture Validator — JSX-aware provenance.
//
// Extends semantic.mjs's intra-procedural trace (entity field -> ViewModel
// key) one hop further: ViewModel key -> does it reach an actual JSX
// expression slot in its consuming component (not just "referenced
// somewhere in the file," which viewmodel-consumption.mjs already checks
// and which is satisfied by e.g. a value used only in a console.log or an
// unrelated computation that never renders). This is real, bounded
// AST tracing — not a claim to resolve arbitrary React runtime behavior.
// See README.md's "Proof boundary" section for exactly where this stops
// and why.
//
// Revision note (Enterprise Semantic Verification pass, 2026-07-24): the
// first version of `collectIdentifiers` matched expression shapes one by
// one (ternary, &&, template literal, ...) and silently produced nothing
// for any shape it didn't special-case — which turned out to be most event
// handlers (`onClick={() => onErr(id)}`, `onCloseAutoFocus={e => {
// triggerRef.current?.focus() }}`) and JSX tag names bound to a local
// variable (`{ icon: Icon } = props; <Icon />`). That silently under-
// collected identifiers, which the rules built on top of read as "this
// prop never reaches JSX" — a false positive, caught during this pass's
// own self-validation against real files (see README's false-positive
// audit for the full account) and fixed here by replacing the shape-by-
// shape matcher with a single generic recursive walk that collects every
// identifier reference, with three explicit, narrow exclusions (property-
// access field names, JSX/object-literal-key labels) rather than an
// allowlist of understood shapes — recursion into arrow function bodies,
// block statements, and nested calls now happens "for free" via
// `ts.forEachChild` instead of needing a case for each one.

import ts from 'typescript'
import { parse } from './ast.mjs'

function walk(node, visit) {
  visit(node)
  ts.forEachChild(node, child => walk(child, visit))
}

/**
 * Collects every identifier *reference* within `node` — i.e. every place a
 * variable/prop/param is actually read, not the label positions next to
 * one (a property-access field name, a JSX attribute's name, an object
 * literal key). Recurses into everything else unconditionally: arrow
 * function bodies (including block statements — event handlers), template
 * literals, conditionals, logical/nullish chains, optional chaining, JSX
 * tag names (a component referenced as `<Icon />` after a destructuring
 * rename), nested JSX, array method callbacks, all of it — because it's a
 * blanket walk with narrow exclusions rather than a list of understood
 * shapes, there is no expression shape this silently produces zero
 * results for the way the previous shape-matching version could.
 */
function collectIdentifiers(node, sf, out) {
  if (!node) return

  if (ts.isIdentifier(node)) {
    out.add(node.text)
    return
  }
  if (ts.isPropertyAccessExpression(node)) {
    collectIdentifiers(node.expression, sf, out) // skip `.name` — a field label, not a reference
    return
  }
  if (ts.isPropertyAssignment(node)) {
    if (node.name && ts.isComputedPropertyName(node.name)) collectIdentifiers(node.name.expression, sf, out)
    collectIdentifiers(node.initializer, sf, out) // skip a non-computed key — a label, not a reference
    return
  }
  if (ts.isJsxAttribute(node)) {
    if (node.initializer) collectIdentifiers(node.initializer, sf, out) // skip the attribute's own name (e.g. `onClick`)
    return
  }
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    collectIdentifiers(node.tagName, sf, out) // a local/renamed component reference, e.g. `<Icon />`
    collectIdentifiers(node.attributes, sf, out)
    return
  }

  ts.forEachChild(node, child => collectIdentifiers(child, sf, out))
}

/** Finds every `<arrayExpr>.map(cb => ...)` call anywhere in `node`, records `{ arrayExprText -> elementParamName }`, and feeds each callback's body into the same identifier collection so the array field and everything its callback touches both land in `out`. */
function collectMappedArrays(node, sf, out, mappedArrays) {
  walk(node, n => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'map') {
      const arrayExprText = n.expression.expression.getText(sf)
      collectIdentifiers(n.expression.expression, sf, out)
      const cb = n.arguments[0]
      if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb))) {
        const paramName = cb.parameters[0] && ts.isIdentifier(cb.parameters[0].name) ? cb.parameters[0].name.text : null
        if (paramName) mappedArrays.set(arrayExprText, paramName)
        if (cb.body) collectIdentifiers(cb.body, sf, out)
      }
    }
  })
}

/**
 * For a component file, returns `{ identifiers: Set<string>, mappedArrays: Map<arrayIdentifier, elementParamName> }`
 * — every identifier reachable from JSX anywhere in the component's return
 * statement(s) (or a JSX-shaped local variable that gets returned), plus
 * which array fields get iterated via `.map()` into JSX and what the
 * element callback parameter is called.
 */
export function traceJsxReachableIdentifiers(fileRel) {
  const sf = parse(fileRel)
  const identifiers = new Set()
  const mappedArrays = new Map()

  function scan(node) {
    collectIdentifiers(node, sf, identifiers)
    collectMappedArrays(node, sf, identifiers, mappedArrays)
  }

  walk(sf, node => {
    if (ts.isReturnStatement(node) && node.expression) {
      scan(node.expression)
    }
    // Components sometimes hold JSX in a local `const content = <div>...`
    // then `return content` — also scan every JSX-shaped variable
    // initializer directly, not only the literal return expression.
    if (ts.isVariableDeclaration(node) && node.initializer
      && (ts.isJsxElement(node.initializer) || ts.isJsxFragment(node.initializer) || ts.isJsxSelfClosingElement(node.initializer))) {
      scan(node.initializer)
    }
    // A render function's only job is deciding what to return — every
    // `if`/ternary condition anywhere in it is by definition render
    // control flow, even when the guarded branch is a plain early exit
    // (`if (isEmpty) return null`) or a branch-selection between two
    // JSX trees (`if (size === 'lg') { return <A/> } return <B/>`) rather
    // than a value sitting inside one specific JSX slot. Verified against
    // real cases during this pass's own self-audit (AvatarInitial's
    // `size`, every ViewModel's `isEmpty`/`isVisible` guard) — treating
    // these as "not reaching render" was a false positive, not a defect.
    if (ts.isIfStatement(node)) {
      collectIdentifiers(node.expression, sf, identifiers)
    }
    if (ts.isConditionalExpression(node)) {
      collectIdentifiers(node.condition, sf, identifiers)
    }
  })

  return { identifiers, mappedArrays }
}

/**
 * Rename map (`declaredName -> localName`) for `const { a: b, c } = <sourceIdentifierName>`
 * destructuring anywhere in the file — resolves the case where a
 * ViewModel/data key is immediately renamed on entry (`const { photoIds:
 * allIds } = viewModel`), so a JSX-reachability check against the
 * ORIGINAL declared name doesn't miss it just because the file never
 * mentions that exact identifier again.
 */
export function getDestructureRenameMap(fileRel, sourceIdentifierName) {
  const sf = parse(fileRel)
  const renames = new Map()
  walk(sf, node => {
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)
      && node.initializer && ts.isIdentifier(node.initializer) && node.initializer.text === sourceIdentifierName) {
      for (const el of node.name.elements) {
        if (ts.isIdentifier(el.name)) renames.set((el.propertyName ?? el.name).getText(sf), el.name.text)
      }
    }
  })
  return renames
}

/**
 * Same rename resolution as `getDestructureRenameMap`, for the common
 * shared-primitive shape where the props object is destructured directly
 * in the function's own parameter list (`function EmptyState({ icon: Icon,
 * title }: Props)`) rather than via a separate `const {...} = props`
 * statement.
 */
export function getParameterDestructureRenameMap(fileRel) {
  const sf = parse(fileRel)
  const renames = new Map()
  walk(sf, node => {
    const isExportedFn = ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!isExportedFn || !node.parameters?.length) return
    const param = node.parameters[0]
    if (ts.isObjectBindingPattern(param.name)) {
      for (const el of param.name.elements) {
        if (ts.isIdentifier(el.name)) renames.set((el.propertyName ?? el.name).getText(sf), el.name.text)
      }
    }
  })
  return renames
}

/**
 * Resolves a local alias (e.g. `visibleEvents` in
 * `const visibleEvents = expanded ? events : events.slice(0, N)`) back to
 * the identifier set its declaration's initializer references — one hop,
 * same bounded principle as semantic.mjs's local-variable resolution. Lets
 * a rule recognize that a `.map()` call over `visibleEvents` is really
 * iterating the ViewModel's `events` field, not a separate, untraceable
 * value.
 */
export function resolveLocalAliasIdentifiers(fileRel, aliasName) {
  const sf = parse(fileRel)
  const out = new Set()
  walk(sf, node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === aliasName && node.initializer) {
      collectIdentifiers(node.initializer, sf, out)
    }
  })
  return out
}

/**
 * Finds every same-file function declaration named `calleeName`, and
 * returns the `.field` accesses on ITS OWN first parameter, anywhere in
 * its body — one hop of inter-procedural resolution, bounded to the same
 * file (not an arbitrary cross-module call graph). This is what lets
 * `resolveEventIcon(item)` — passing a `.map()` element WHOLE to a local
 * helper, rather than accessing `item.field` directly at the call site —
 * still count the helper's own `item.iconKey`-shaped accesses as real
 * consumption, instead of a false "never accessed" finding.
 */
function resolveWholeObjectPassthroughFields(sf, calleeName) {
  const fields = new Set()
  walk(sf, node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === calleeName && node.parameters?.length && node.body) {
      const calleeParam = node.parameters[0]
      if (!ts.isIdentifier(calleeParam.name)) return
      const calleeParamName = calleeParam.name.text
      walk(node.body, n => {
        if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === calleeParamName) {
          fields.add(n.name.text)
        }
      })
    }
  })
  return fields
}

/** For a `.map()` callback body found while tracing `arrayFieldName`, which of the ELEMENT type's fields are referenced — by direct `paramName.field` access anywhere in the callback, OR by being passed whole to a same-file helper function that itself accesses `.field` on its own parameter (see `resolveWholeObjectPassthroughFields`). */
export function traceMappedElementFields(fileRel, arrayFieldName, elementParamName) {
  const sf = parse(fileRel)
  const fields = new Set()

  walk(sf, node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.expression.getText(sf) === arrayFieldName && node.expression.name.text === 'map') {
      const cb = node.arguments[0]
      if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.body) {
        walk(cb.body, n => {
          if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === elementParamName) {
            fields.add(n.name.text)
          }
          // Whole-object passthrough: `someHelper(item)` or `someHelper(item, ...)`.
          if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)
            && n.arguments.some(a => ts.isIdentifier(a) && a.text === elementParamName)) {
            for (const f of resolveWholeObjectPassthroughFields(sf, n.expression.text)) fields.add(f)
          }
        })
      }
    }
  })

  return fields
}
