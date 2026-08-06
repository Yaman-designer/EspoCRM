#!/usr/bin/env node
// Architecture Validator — CI entrypoint.
//
// Statically analyzes the Details-page framework (src/features/properties,
// src/components/shared, src/shared/detail-view) against the layer rules
// documented in src/features/properties/ARCHITECTURE.md, and fails (exit
// code 1) if any rule reports a violation. Run: `node scripts/architecture-validator/index.mjs`
// (or `npm run validate:architecture`).

import * as layerDirection from './rules/layer-direction.mjs'
import * as entityLeakage from './rules/entity-leakage.mjs'
import * as viewmodelPurity from './rules/viewmodel-purity.mjs'
import * as sharedIsolation from './rules/shared-isolation.mjs'
import * as dependencyGraph from './rules/dependency-graph.mjs'
import * as fieldCoverage from './rules/field-coverage.mjs'
import * as enumCoverage from './rules/enum-coverage.mjs'
import * as duplication from './rules/duplication.mjs'
// Semantic dataflow layer (Enterprise Semantic Dataflow Validation pass,
// 2026-07-24) — extends structural validation above with real,
// AST-provenance-based tracing. See semantic.mjs's own doc comment and
// README.md's "Semantic scope" section for exactly what these three do and
// don't prove.
import * as viewmodelConsumption from './rules/viewmodel-consumption.mjs'
import * as duplicateTransform from './rules/duplicate-transform.mjs'
import * as fieldLineage from './rules/field-lineage.mjs'
// JSX-aware provenance (Enterprise Semantic Verification pass, 2026-07-24)
// — extends tracing past the ViewModel boundary into actual JSX expression
// slots, and one justified inter-procedural hop into this codebase's own
// shared primitives. See jsx-provenance.mjs and each rule's own header for
// exactly what's proven and where proof stops.
import * as jsxRenderConsumption from './rules/jsx-render-consumption.mjs'
import * as primitivePropConsumption from './rules/primitive-prop-consumption.mjs'

const RULES = [
  layerDirection, entityLeakage, viewmodelPurity, sharedIsolation,
  dependencyGraph, fieldCoverage, enumCoverage, duplication,
  viewmodelConsumption, duplicateTransform, fieldLineage,
  jsxRenderConsumption, primitivePropConsumption,
]

const isJson = process.argv.includes('--json')
const isQuiet = process.argv.includes('--quiet')
const wantsGraph = process.argv.includes('--graph')

function printHuman(results) {
  let totalViolations = 0
  let totalWarnings = 0

  for (const r of results) {
    totalViolations += r.violations.length
    totalWarnings += (r.warnings ?? []).length
    const status = r.violations.length === 0 ? 'PASS' : 'FAIL'
    console.log(`\n[${status}] ${r.name} (${r.id})`)
    for (const v of r.violations) {
      console.log(`  ✗ ${v.file}${v.line ? `:${v.line}` : ''} — ${v.message}`)
    }
    if (!isQuiet) {
      for (const w of r.warnings ?? []) {
        console.log(`  · ${w.file}${w.line ? `:${w.line}` : ''} — ${w.message}`)
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`${totalViolations === 0 ? '✓' : '✗'} ${totalViolations} violation(s), ${totalWarnings} info/warning line(s) across ${results.length} rules.`)
  return totalViolations
}

function main() {
  const results = RULES.map(rule => rule.run())

  if (wantsGraph) {
    const lineageResult = results.find(r => r.id === 'field-lineage')
    console.log(JSON.stringify(lineageResult?.graph ?? [], null, 2))
    process.exit(0)
  }

  if (isJson) {
    console.log(JSON.stringify(results, null, 2))
  }

  const totalViolations = isJson
    ? results.reduce((sum, r) => sum + r.violations.length, 0)
    : printHuman(results)

  process.exit(totalViolations > 0 ? 1 : 0)
}

main()
