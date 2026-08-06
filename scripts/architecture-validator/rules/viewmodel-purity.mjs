// Rule: ViewModel purity.
// A ViewModel must contain data only: no React, no JSX, no Tailwind, no
// icons, no components, no hooks, no UI libraries, no presentation
// configuration (detected as: importing anything from the UI-library list,
// containing JSX syntax, calling anything shaped like a React hook, or not
// being a plain .ts file in the first place).

import path from 'node:path'
import { listFiles, getImports, containsJsx, getCallExpressionNames, getClassNameStrings } from '../ast.mjs'
import { FEATURE_ROOTS, LAYER_SUBPATHS, UI_LIBRARY_IMPORTS, REACT_HOOK_CALL_PATTERN } from '../config.mjs'

export const id = 'viewmodel-purity'
export const name = 'ViewModel purity'

function matchesUiLibrary(specifier) {
  return UI_LIBRARY_IMPORTS.some(pattern =>
    pattern.endsWith('/') ? specifier.startsWith(pattern) : specifier === pattern,
  )
}

export function run() {
  const violations = []

  for (const featureRoot of FEATURE_ROOTS) {
    const viewModelsRoot = path.posix.join(featureRoot, LAYER_SUBPATHS.viewModels)

    for (const file of listFiles(viewModelsRoot, ['.ts', '.tsx'])) {
      if (file.endsWith('.tsx')) {
        violations.push({ file, line: 0, message: 'ViewModel file has a .tsx extension — JSX has no legitimate use in a data-only layer.' })
      }

      for (const imp of getImports(file)) {
        if (matchesUiLibrary(imp.specifier)) {
          violations.push({
            file, line: imp.line,
            message: `Imports '${imp.specifier}' — a UI-library import in a ViewModel. Icon/component resolution belongs in the presentational component, keyed off a semantic string the ViewModel emits instead.`,
          })
        }
      }

      if (containsJsx(file)) {
        violations.push({ file, line: 0, message: 'Contains JSX syntax — ViewModels render nothing.' })
      }

      for (const call of getCallExpressionNames(file)) {
        if (REACT_HOOK_CALL_PATTERN.test(call.name)) {
          // Defense in depth against a namespace import bypassing the
          // specifier check above (e.g. `import * as React from 'react'`
          // then `React.useState(...)` — still caught by the specifier
          // check on the `react` import itself, but a bare `useFoo(...)`
          // reaching this file via re-export would only be caught here.
          violations.push({
            file, line: call.line,
            message: `Calls '${call.name}(...)', which reads as a React hook — ViewModels are plain functions, called once per render by the container, not hooks themselves.`,
          })
        }
      }

      if (getClassNameStrings(file).size > 0) {
        violations.push({ file, line: 0, message: 'Contains Tailwind class-name strings — styling is a presentation concern.' })
      }
    }
  }

  return { id, name, violations }
}
