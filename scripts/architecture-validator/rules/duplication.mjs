// Rule: architectural duplication.
//
// Two independent, bounded heuristics — both report as WARNINGS (needing a
// human to confirm real duplication and decide whether to extract), never
// as hard failures: structural similarity is genuine evidence worth
// surfacing, but false positives are inherent to any similarity heuristic,
// and this rule set's own governing principle (see ARCHITECTURE.md) is
// "extract only verified duplication" — a heuristic finding is the
// verification's starting point, not its conclusion.
//
//  1. Duplicate ViewModel shape — two exported interfaces/type-literals
//     across view-models/*.ts with >= 80% of the same field names.
//  2. Duplicate presentation primitive — two section components whose
//     className-string sets overlap heavily (Jaccard similarity), which is
//     exactly the smell that produced SectionHeader/EmptyState/TonePill/
//     InfoRow/AvatarInitial in earlier passes.

import path from 'node:path'
import { listFiles, getExportedShapes, getClassNameStrings } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, SHARED_PRIMITIVES_ROOT } from '../config.mjs'

export const id = 'duplication'
export const name = 'Architectural duplication (heuristic — review required)'

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const x of a) if (b.has(x)) intersection++
  return intersection / (a.size + b.size - intersection)
}

export function run() {
  const warnings = []

  for (const featureRoot of FEATURE_ROOTS) {
    // ── 1. Duplicate ViewModel shape ──────────────────────────────────────
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)
    const shapes = []
    for (const file of listFiles(viewModelsRoot)) {
      for (const shape of getExportedShapes(file)) {
        if (shape.fields.length >= 3) shapes.push({ file, ...shape }) // skip trivial 1-2-field shapes — too noisy to be useful signal
      }
    }
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = new Set(shapes[i].fields)
        const b = new Set(shapes[j].fields)
        const sim = jaccard(a, b)
        if (sim >= 0.8) {
          warnings.push({
            file: shapes[i].file, line: 0,
            message: `Possible duplicate ViewModel shape: '${shapes[i].name}' (${shapes[i].file}) and '${shapes[j].name}' (${shapes[j].file}) share ${Math.round(sim * 100)}% of their field names — [${shapes[i].fields.join(', ')}] vs [${shapes[j].fields.join(', ')}]. Verify the two are actually the same concept before merging; a coincidental field-name overlap is not evidence on its own.`,
          })
        }
      }
    }

    // ── 2. Duplicate presentation primitive ───────────────────────────────
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)
    const sharedFiles = new Set(listFiles(SHARED_PRIMITIVES_ROOT))
    const classNameSets = []
    for (const file of [...listFiles(sectionsRoot), ...sharedFiles]) {
      const classes = getClassNameStrings(file)
      if (classes.size >= 4) classNameSets.push({ file, classes }) // skip files with too little surface to compare meaningfully
    }
    for (let i = 0; i < classNameSets.length; i++) {
      for (let j = i + 1; j < classNameSets.length; j++) {
        const sim = jaccard(classNameSets[i].classes, classNameSets[j].classes)
        if (sim >= 0.5) {
          warnings.push({
            file: classNameSets[i].file, line: 0,
            message: `Possible duplicate presentation pattern: '${classNameSets[i].file}' and '${classNameSets[j].file}' share ${Math.round(sim * 100)}% of their literal className strings. Read both before extracting — earlier passes on this codebase found patterns that looked identical from a distance but had real, deliberate pixel differences (see EmptyState.tsx's own note).`,
          })
        }
      }
    }
  }

  return { id, name, violations: [], warnings }
}
