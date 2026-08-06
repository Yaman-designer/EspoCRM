// Architecture Validator — semantic provenance engine.
//
// Extends the structural validator (layer-direction, entity-leakage, etc.)
// with a bounded, honest form of intra-procedural dataflow tracing: for
// each `build<X>ViewModel` function, trace each field of its returned
// object back to the entity field(s) it came from, through at most one
// local-variable hop and one formatter-call wrapper.
//
// WHAT THIS IS: real AST-based provenance tracing, sound for the patterns
// this codebase actually uses (direct field access, one formatter call,
// one intermediate local variable). It answers "which entity field(s), if
// any, does this ViewModel output key syntactically derive from" —
// genuinely useful, genuinely automatable.
//
// WHAT THIS IS NOT: full symbolic execution, points-to analysis, or a
// formatter-output correctness checker. It cannot prove `formatCurrency(price)`
// produces a *correct* dollar string — only that `price` (or a value
// derived from it) reached that call. Proving output correctness for a
// specific input is what the project's own unit tests already do (see
// e.g. financial.viewmodel.test.ts's exact input→output assertions) — that
// is the right tool for that job, not a second, weaker static
// approximation of it. See README.md's "Semantic scope" section for the
// full boundary.

import ts from 'typescript'
import { parse, getDestructuredNames } from './ast.mjs'

function walk(node, visit) {
  visit(node)
  ts.forEachChild(node, child => walk(child, visit))
}

/** Finds every `export function build<X>ViewModel(...)` (or exported const arrow-function of the same name shape) in a file. */
function findViewModelBuilders(sf) {
  const builders = []
  walk(sf, node => {
    const isExportedFn = ts.isFunctionDeclaration(node) && node.name && /^build.*ViewModel$/.test(node.name.text)
      && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    if (isExportedFn && node.body) {
      builders.push({ name: node.name.text, params: node.parameters, body: node.body })
    }
  })
  return builders
}

/** True entity-field-accessor names this tracer recognizes as "the input" — the function's first parameter, whatever it's called. */
function primaryParamName(params) {
  const first = params[0]
  if (first && ts.isIdentifier(first.name)) return first.name.text
  return null
}

function calleeName(expr) {
  if (ts.isIdentifier(expr)) return expr.text
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text // e.g. Math.round -> "round"; String -> "String" handled by isIdentifier
  return null
}

/** `null` or the identifier `undefined` — the two ways this codebase spells "nothing" in a fallback branch. */
function isNullishLiteral(expr) {
  return expr.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(expr) && expr.text === 'undefined')
}

/**
 * Classifies a single initializer expression as directly/formatted-derived
 * from `paramName.<field>`, resolving at most one local-variable hop via
 * `localVars` (name -> initializer expression, from `const name = expr`
 * statements earlier in the same function body). Returns
 * `{ kind: 'direct'|'formatted'|'derived', field?, formatter? }`.
 */
function classify(expr, paramName, localVars, sf, destructuredNames, depth = 0) {
  if (!expr) return { kind: 'derived' }

  // property.field
  if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === paramName) {
    return { kind: 'direct', field: expr.name.text }
  }

  // A bare identifier that is itself a destructured field of the primary
  // param (`const { createdAt } = property`) — resolvable at any depth,
  // since this is a rename, not a transform: the value is the field.
  if (ts.isIdentifier(expr) && destructuredNames.has(expr.text)) {
    return { kind: 'direct', field: expr.text }
  }

  // formatterFn(property.field, ...otherArgs) — otherArgs may be literals/options, only the first arg needs to trace to a field
  if (ts.isCallExpression(expr) && expr.arguments.length > 0) {
    const fn = calleeName(expr.expression)
    const inner = classify(expr.arguments[0], paramName, localVars, sf, destructuredNames, depth + 1)
    if (inner.kind !== 'derived') {
      return { kind: 'formatted', field: inner.field, formatter: fn ?? '<anonymous>' }
    }
  }

  // Nullish-coalescing / logical fallback chains where every branch traces
  // to the SAME field (e.g. `property.a ?? property.a` — rare, but a
  // single-field ternary like `x ? property.a : undefined` is common: the
  // condition often mirrors the value itself in this codebase's style).
  if (ts.isConditionalExpression(expr)) {
    if (isNullishLiteral(expr.whenFalse)) {
      const whenTrue = classify(expr.whenTrue, paramName, localVars, sf, destructuredNames, depth + 1)
      if (whenTrue.kind !== 'derived') return whenTrue
    }
    if (isNullishLiteral(expr.whenTrue)) {
      const whenFalse = classify(expr.whenFalse, paramName, localVars, sf, destructuredNames, depth + 1)
      if (whenFalse.kind !== 'derived') return whenFalse
    }
    return { kind: 'derived' }
  }
  if ((ts.isBinaryExpression(expr)) && (expr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
    const left = classify(expr.left, paramName, localVars, sf, destructuredNames, depth + 1)
    if (left.kind !== 'derived') return left
  }

  // One local-variable hop: `identifier` where `const identifier = <expr>` appeared earlier.
  if (depth === 0 && ts.isIdentifier(expr) && localVars.has(expr.text)) {
    return classify(localVars.get(expr.text), paramName, localVars, sf, destructuredNames, depth + 1)
  }

  return { kind: 'derived' }
}

/**
 * Traces every `build<X>ViewModel` function in `fileRel`. Returns an array
 * of `{ functionName, fields: [{ key, kind, field, formatter }] }` — one
 * entry per builder function found, `fields` covering every property of
 * its (last, i.e. main-path) returned object literal.
 */
export function traceViewModelBuilders(fileRel) {
  const sf = parse(fileRel)
  const builders = findViewModelBuilders(sf)
  const results = []

  for (const builder of builders) {
    const paramName = primaryParamName(builder.params)
    if (!paramName) continue

    const localVars = new Map()
    let lastReturnObject = null

    for (const stmt of builder.body.statements) {
      if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.initializer) localVars.set(decl.name.text, decl.initializer)
        }
      }
      if (ts.isReturnStatement(stmt) && stmt.expression) {
        let expr = stmt.expression
        if (ts.isParenthesizedExpression(expr)) expr = expr.expression
        if (ts.isObjectLiteralExpression(expr)) {
          lastReturnObject = expr
        } else if (ts.isIdentifier(expr) && localVars.has(expr.text)) {
          const resolved = localVars.get(expr.text)
          if (ts.isObjectLiteralExpression(resolved)) lastReturnObject = resolved
        }
      }
    }

    if (!lastReturnObject) continue

    const destructured = getDestructuredNames(fileRel, paramName)
    const fields = []

    for (const prop of lastReturnObject.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const key = prop.name.text
        const result = classify(prop.initializer, paramName, localVars, sf, destructured)
        fields.push({ key, ...result })
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        const key = prop.name.text
        // Shorthand: `{ price }` where `price` came from destructuring the
        // param directly, or from a local var — both resolve the same way
        // a named PropertyAssignment's identifier initializer would.
        if (destructured.has(key)) {
          fields.push({ key, kind: 'direct', field: key })
        } else if (localVars.has(key)) {
          fields.push({ key, ...classify(localVars.get(key), paramName, localVars, sf, destructured, 1) })
        } else {
          fields.push({ key, kind: 'derived' })
        }
      } else if (ts.isSpreadAssignment(prop)) {
        fields.push({ key: '...spread', kind: 'derived' })
      }
    }

    results.push({ functionName: builder.name, fields })
  }

  return results
}
