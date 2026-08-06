// Rule: layer dependency direction.
// Allowed: Container -> Mapper -> Formatter -> ViewModel -> Presentation
// Forbidden edges checked here:
//   Presentation (sections/**) -> Repository/Service (the API/data-access layer)
//   Mapper (lib/mappers/**)    -> Component (components/**)
//   ViewModel (view-models/**) -> Component (components/**)   [also checked by viewmodel-purity, kept here for completeness of "layer direction" as its own rule]

import fs from 'node:fs'
import path from 'node:path'
import { listFiles, getImports } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, EXCEPTIONS_FILE } from '../config.mjs'

export const id = 'layer-direction'
export const name = 'Layer dependency direction'

function loadServiceLayerExceptions() {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_FILE, 'utf8'))
  return new Set((raw.serviceLayerAccess ?? []).map(e => e.file))
}

export function run() {
  const violations = []
  const serviceExceptions = loadServiceLayerExceptions()

  for (const featureRoot of FEATURE_ROOTS) {
    const sectionsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.sections)
    const mappersRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.mappers)
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)

    // Presentation -> Repository/Service forbidden, unless documented in
    // exceptions.json's serviceLayerAccess list (async-data-owning
    // components — same category as the entityLeakage exceptions).
    for (const file of listFiles(sectionsRoot)) {
      if (serviceExceptions.has(file)) continue
      for (const imp of getImports(file)) {
        if (/\/repositories\//.test(imp.specifier) || /\/services\//.test(imp.specifier)) {
          violations.push({
            file, line: imp.line,
            message: `Presentation component imports directly from the repository/service (API) layer via '${imp.specifier}'. Presentation components take a ViewModel built by the container — they must not reach past it into the data-access layer. If this component genuinely owns async data fetching, add it to exceptions.json's serviceLayerAccess list.`,
          })
        }
      }
    }

    // Mapper -> Component forbidden.
    for (const file of listFiles(mappersRoot)) {
      for (const imp of getImports(file)) {
        if (/\/components\//.test(imp.specifier) || imp.specifier.startsWith('@/components/')) {
          violations.push({
            file, line: imp.line,
            message: `Mapper imports from the presentation layer via '${imp.specifier}'. Mappers produce data for a ViewModel; they must never depend on how that data is rendered.`,
          })
        }
      }
    }

    // ViewModel -> Component forbidden (layer-direction view; viewmodel-purity.mjs covers the fuller UI-purity rule set).
    for (const file of listFiles(viewModelsRoot)) {
      for (const imp of getImports(file)) {
        if (/\/components\/sections\//.test(imp.specifier)) {
          violations.push({
            file, line: imp.line,
            message: `ViewModel imports from components/sections/ via '${imp.specifier}' — a ViewModel must never depend on a specific presentational component.`,
          })
        }
      }
    }
  }

  return { id, name, violations }
}
