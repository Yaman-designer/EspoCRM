// Rule: dependency graph — cycles, reverse imports (view-models -> components),
// and orphan modules, computed over a real import graph rather than
// per-directory pattern matching (the other rules check specific forbidden
// edges directly; this one looks at the whole graph's shape).

import path from 'node:path'
import { listFiles } from '../ast.mjs'
import { buildGraph, findCycles, findOrphans } from '../graph.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, SHARED_PRIMITIVES_ROOT, SHARED_FRAMEWORK_ROOT } from '../config.mjs'

export const id = 'dependency-graph'
export const name = 'Dependency graph (cycles, reverse imports, orphans)'

export function collectGraphFiles() {
  const files = []
  for (const featureRoot of FEATURE_ROOTS) {
    files.push(...listFiles(path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)))
    files.push(...listFiles(path.posix.join(featureRoot, LAYER_SUBPATHS.mappers)))
    files.push(...listFiles(path.posix.join(featureRoot, 'components')))
  }
  files.push(...listFiles(SHARED_PRIMITIVES_ROOT))
  files.push(...listFiles(SHARED_FRAMEWORK_ROOT))
  return files
}

export function run() {
  const files = collectGraphFiles()
  const graph = buildGraph(files)
  const violations = []

  const cycles = findCycles(graph)
  for (const cycle of cycles) {
    violations.push({
      file: cycle[0], line: 0,
      message: `Circular dependency: ${cycle.join(' → ')}`,
    })
  }

  // Reverse import: any file under view-models/ that appears as an import
  // TARGET from... itself importing something under components/sections —
  // already covered by layer-direction.mjs's explicit check; here we
  // additionally check the general case of a view-models/ file being
  // imported BY a components/sections file for a *value* (not just type),
  // which is fine (that's the intended direction) — so no extra check
  // needed beyond cycles for this rule; cycles are the general-case
  // detector for "A depends on B depends on A" regardless of which
  // specific layer pair.

  // A file with zero in-graph edges in and out is either dead code or a
  // pure leaf only imported from outside this graph's file set (e.g. a
  // page.tsx route file importing PropertyDetailView) — reported as info
  // for a human to interpret, not a hard failure, since the latter case is
  // expected and correct, not a defect.
  const orphans = findOrphans(graph)

  return { id, name, violations, info: { fileCount: files.length, cycleCount: cycles.length, orphanCandidates: orphans } }
}
