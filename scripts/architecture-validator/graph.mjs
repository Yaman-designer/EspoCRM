// Architecture Validator — dependency graph construction + cycle detection.

import fs from 'node:fs'
import path from 'node:path'
import { REPO_ROOT } from './config.mjs'
import { getImports } from './ast.mjs'

const SRC_ROOTS = ['src']

/** Resolves an import specifier (relative or `@/...`) written in `fromFileRel` to a repo-relative module file, or null if it's an external package / unresolvable. */
function resolveSpecifier(fromFileRel, specifier) {
  let baseRel
  if (specifier.startsWith('.')) {
    baseRel = path.posix.normalize(path.posix.join(path.posix.dirname(fromFileRel), specifier))
  } else if (specifier.startsWith('@/')) {
    baseRel = path.posix.join('src', specifier.slice(2))
  } else {
    return null // external package — a graph leaf, not part of this repo's cycle space
  }

  const candidates = [
    baseRel,
    `${baseRel}.ts`, `${baseRel}.tsx`,
    path.posix.join(baseRel, 'index.ts'), path.posix.join(baseRel, 'index.tsx'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(path.join(REPO_ROOT, c)) && fs.statSync(path.join(REPO_ROOT, c)).isFile()) return c
  }
  return null
}

/** Builds { file -> Set<file> } for every file discovered under `files`. */
export function buildGraph(files) {
  const graph = new Map()
  for (const file of files) {
    const edges = new Set()
    for (const imp of getImports(file)) {
      const resolved = resolveSpecifier(file, imp.specifier)
      if (resolved && resolved !== file) edges.add(resolved)
    }
    graph.set(file, edges)
  }
  return graph
}

/** Tarjan-style DFS cycle detection. Returns an array of cycles, each a file path array. */
export function findCycles(graph) {
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map()
  const cycles = []
  const stack = []

  function visit(node) {
    color.set(node, GRAY)
    stack.push(node)
    for (const next of graph.get(node) ?? []) {
      const c = color.get(next) ?? WHITE
      if (c === WHITE) {
        visit(next)
      } else if (c === GRAY) {
        const cycleStart = stack.indexOf(next)
        cycles.push([...stack.slice(cycleStart), next])
      }
    }
    stack.pop()
    color.set(node, BLACK)
  }

  for (const node of graph.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) visit(node)
  }
  return cycles
}

/** Files present in the graph's keys that nothing else in the graph imports, AND that import nothing in-graph either — a true orphan. */
export function findOrphans(graph) {
  const imported = new Set()
  for (const edges of graph.values()) for (const e of edges) imported.add(e)
  const orphans = []
  for (const [file, edges] of graph) {
    if (edges.size === 0 && !imported.has(file)) orphans.push(file)
  }
  return orphans
}
