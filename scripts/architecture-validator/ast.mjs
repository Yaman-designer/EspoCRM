// Architecture Validator — AST utilities.
//
// Thin, purpose-built wrappers over the TypeScript compiler API
// (`typescript`, already a project dependency — no new package added).
// Syntactic analysis only (no `ts.Program`/type-checker) — fast, and
// sufficient for every rule this validator implements: import direction,
// prop-type leakage, Pick<> field extraction, and enum-literal extraction
// are all syntactic facts, not type-inference facts.

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { REPO_ROOT } from './config.mjs'

export function listFiles(dirRel, extensions = ['.ts', '.tsx']) {
  const dirAbs = path.join(REPO_ROOT, dirRel)
  if (!fs.existsSync(dirAbs)) return []
  const out = []
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const childRel = path.join(dirRel, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(childRel, extensions))
    } else if (extensions.some(ext => entry.name.endsWith(ext)) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      out.push(childRel.split(path.sep).join('/'))
    }
  }
  return out
}

const sourceCache = new Map()

export function parse(fileRel) {
  if (sourceCache.has(fileRel)) return sourceCache.get(fileRel)
  const fileAbs = path.join(REPO_ROOT, fileRel)
  const text = fs.readFileSync(fileAbs, 'utf8')
  const kind = fileRel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(fileRel, text, ts.ScriptTarget.Latest, true, kind)
  sourceCache.set(fileRel, sf)
  return sf
}

function walk(node, visit) {
  visit(node)
  ts.forEachChild(node, child => walk(child, visit))
}

/** Every `import ... from '<specifier>'` in a file, with the syntax node for location reporting. */
export function getImports(fileRel) {
  const sf = parse(fileRel)
  const imports = []
  walk(sf, node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push({
        specifier: node.moduleSpecifier.text,
        isTypeOnly: !!node.importClause?.isTypeOnly,
        line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        namedImports: extractNamedImports(node),
      })
    }
  })
  return imports
}

function extractNamedImports(importDecl) {
  const clause = importDecl.importClause
  if (!clause) return []
  const names = []
  if (clause.name) names.push({ name: clause.name.text, isTypeOnly: !!clause.isTypeOnly })
  if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
    for (const el of clause.namedBindings.elements) {
      names.push({ name: (el.propertyName ?? el.name).text, isTypeOnly: !!el.isTypeOnly || !!clause.isTypeOnly })
    }
  }
  return names
}

/** Every call expression's callee name, e.g. to spot `useState(...)`, `useEffect(...)`. */
export function getCallExpressionNames(fileRel) {
  const sf = parse(fileRel)
  const names = []
  walk(sf, node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      names.push({ name: node.expression.text, line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1 })
    }
  })
  return names
}

/** Does this file contain JSX syntax at all (elements/fragments/self-closing tags)? */
export function containsJsx(fileRel) {
  const sf = parse(fileRel)
  let found = false
  walk(sf, node => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) found = true
  })
  return found
}

/**
 * String-literal union members inside every `Pick<Foo, 'a' | 'b' | ...>`
 * type reference in the file, regardless of what `Foo` is named —
 * intentionally not filtered to `RealEstateProperty` here so the caller
 * can decide.
 */
export function getPickFieldLiterals(fileRel) {
  const sf = parse(fileRel)
  const fields = new Set()
  walk(sf, node => {
    if (ts.isTypeReferenceNode(node) && node.typeName.getText(sf) === 'Pick' && node.typeArguments?.length === 2) {
      const literalArg = node.typeArguments[1]
      collectStringLiteralsFromType(literalArg, sf, fields)
    }
  })
  return fields
}

function collectStringLiteralsFromType(typeNode, sf, out) {
  if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
    out.add(typeNode.literal.text)
  } else if (ts.isUnionTypeNode(typeNode)) {
    for (const t of typeNode.types) collectStringLiteralsFromType(t, sf, out)
  }
}

/** Every `<ident>.<prop>` member-access expression's `<prop>` name, for a given `<ident>` (e.g. "property"). */
export function getPropertyAccessNames(fileRel, identifierName) {
  const sf = parse(fileRel)
  const names = new Set()
  walk(sf, node => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === identifierName) {
      names.add(node.name.text)
    }
  })
  return names
}

/**
 * Every destructured field name from `const { a, b: c, ...rest } = <identifierName>`
 * (matches destructuring directly off the named identifier, and one level
 * of destructuring off a parameter named `identifierName`).
 */
export function getDestructuredNames(fileRel, identifierName) {
  const sf = parse(fileRel)
  const names = new Set()
  walk(sf, node => {
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)
      && node.initializer && ts.isIdentifier(node.initializer) && node.initializer.text === identifierName) {
      for (const el of node.name.elements) {
        if (ts.isIdentifier(el.name)) names.add((el.propertyName ?? el.name).getText(sf))
      }
    }
  })
  return names
}

/** Top-level `interface Foo { a: T; b: T }` member names, by interface name. */
export function getInterfaceMembers(fileRel, interfaceName) {
  const sf = parse(fileRel)
  const names = new Set()
  walk(sf, node => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (member.name && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) {
          names.add(member.name.getText(sf).replace(/['"]/g, ''))
        }
      }
    }
  })
  return names
}

/** For an interface's array-typed members only (`x: Foo[]` or `x: Array<Foo>`), `{ memberName -> elementTypeName }`. */
export function getInterfaceArrayMemberElementTypes(fileRel, interfaceName) {
  const sf = parse(fileRel)
  const result = new Map()
  walk(sf, node => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (!member.name || !ts.isIdentifier(member.name) || !member.type) continue
        if (ts.isArrayTypeNode(member.type) && ts.isTypeReferenceNode(member.type.elementType)) {
          result.set(member.name.text, member.type.elementType.typeName.getText(sf))
        } else if (ts.isTypeReferenceNode(member.type) && member.type.typeName.getText(sf) === 'Array' && member.type.typeArguments?.[0] && ts.isTypeReferenceNode(member.type.typeArguments[0])) {
          result.set(member.name.text, member.type.typeArguments[0].typeName.getText(sf))
        }
      }
    }
  })
  return result
}

/** All top-level `export interface`/`export type` names declared in a file, with their member-name sets (best-effort; type aliases to object literals only). */
export function getExportedShapes(fileRel) {
  const sf = parse(fileRel)
  const shapes = []
  walk(sf, node => {
    if (ts.isInterfaceDeclaration(node) && hasExportModifier(node)) {
      shapes.push({ name: node.name.text, fields: interfaceMemberNames(node, sf) })
    }
    if (ts.isTypeAliasDeclaration(node) && hasExportModifier(node) && ts.isTypeLiteralNode(node.type)) {
      shapes.push({ name: node.name.text, fields: typeLiteralMemberNames(node.type, sf) })
    }
  })
  return shapes
}

function hasExportModifier(node) {
  return !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
}
function interfaceMemberNames(node, sf) {
  return node.members.filter(m => m.name).map(m => m.name.getText(sf).replace(/['"]/g, '')).sort()
}
function typeLiteralMemberNames(node, sf) {
  return node.members.filter(m => m.name).map(m => m.name.getText(sf).replace(/['"]/g, '')).sort()
}

/** String literal values compared in `=== 'literal'` / `case 'literal':` anywhere in the file, plus object-literal string keys. */
export function getComparedStringLiterals(fileRel) {
  const sf = parse(fileRel)
  const literals = new Set()
  walk(sf, node => {
    if (ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken)) {
      if (ts.isStringLiteral(node.right)) literals.add(node.right.text)
      if (ts.isStringLiteral(node.left)) literals.add(node.left.text)
    }
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) {
      literals.add(node.expression.text)
    }
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) {
      literals.add(node.name.text)
    }
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
      // Record<Status,...> object literals keyed by a plain identifier that
      // happens to be a valid literal (e.g. `Active:` without quotes).
      literals.add(node.name.text)
    }
  })
  return literals
}

/** Union-literal member values of a top-level `export type Foo = 'a' | 'b' | ...`. */
export function getUnionTypeLiterals(fileRel, typeName) {
  const sf = parse(fileRel)
  const values = new Set()
  walk(sf, node => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      collectStringLiteralsFromType(node.type, sf, values)
    }
  })
  return values
}

/** Every string-literal `className="..."` JSX attribute plus every string-literal argument to a call named `cn`. */
export function getClassNameStrings(fileRel) {
  const sf = parse(fileRel)
  const strings = new Set()
  walk(sf, node => {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'className' && node.initializer && ts.isStringLiteral(node.initializer)) {
      strings.add(node.initializer.text)
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'cn') {
      for (const arg of node.arguments) {
        if (ts.isStringLiteral(arg)) strings.add(arg.text)
      }
    }
  })
  return strings
}

/**
 * The ViewModel type name a component actually receives as its
 * `viewModel`/`data` prop — NOT every `*ViewModel`-suffixed name
 * referenced anywhere in the file (a component often also references
 * *element*-shaped ViewModel types like `SpecItemViewModel` or
 * `TimelineEventViewModel` for a helper function's parameter type; those
 * are not the component's own prop type and must not be treated as one —
 * an earlier version of this resolver conflated the two and produced
 * false "orphan field" reports on fields that were really consumed via a
 * `.map()` callback over an array field, just under a different local
 * name). Resolves through one level of indirection (a named `FooProps`
 * interface) if the component doesn't inline its prop type.
 */
export function getComponentViewModelPropTypeName(fileRel) {
  const sf = parse(fileRel)
  let propsTypeNode = null

  walk(sf, node => {
    if (propsTypeNode) return
    const isExportedComponent = (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node))
    if (!isExportedComponent) return
    const fn = ts.isFunctionDeclaration(node) ? node : findArrowFunction(node)
    if (!fn || !fn.parameters?.length) return
    if (ts.isFunctionDeclaration(node) && !node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) return
    const param = fn.parameters[0]
    if (param.type) propsTypeNode = param.type
  })
  if (!propsTypeNode) return null

  let typeLiteral = null
  if (ts.isTypeLiteralNode(propsTypeNode)) {
    typeLiteral = propsTypeNode
  } else if (ts.isTypeReferenceNode(propsTypeNode)) {
    const refName = propsTypeNode.typeName.getText(sf)
    walk(sf, node => {
      if (!typeLiteral && ts.isInterfaceDeclaration(node) && node.name.text === refName) {
        typeLiteral = { members: node.members } // duck-typed: same shape our member-scan below needs
      }
    })
  }
  if (!typeLiteral) return null

  for (const member of typeLiteral.members) {
    if (member.name && ts.isIdentifier(member.name) && (member.name.text === 'viewModel' || member.name.text === 'data')) {
      if (member.type && ts.isTypeReferenceNode(member.type)) return member.type.typeName.getText(sf)
    }
  }
  return null
}

function findArrowFunction(variableStatement) {
  for (const decl of variableStatement.declarationList.declarations) {
    if (decl.initializer && ts.isArrowFunction(decl.initializer)) return decl.initializer
  }
  return null
}

/** Every call expression `<name>(<args>)` with each argument's own source text, for matching a formatter call's argument against a known identifier (e.g. "was this ViewModel output key passed straight into another call to the same formatter"). */
export function getCallExpressionsWithArgs(fileRel) {
  const sf = parse(fileRel)
  const calls = []
  walk(sf, node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      calls.push({
        name: node.expression.text,
        args: node.arguments.map(a => a.getText(sf)),
        line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      })
    }
  })
  return calls
}
