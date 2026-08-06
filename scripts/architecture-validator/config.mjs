// Architecture Validator — configuration.
//
// Path roots for the Details-page framework's layers. Everything here is
// relative to the repo root. Adding a new entity's Details page (Contact,
// Company, ...) that follows the same folder shape as `properties/` will
// automatically be covered by adding its root to FEATURE_ROOTS below —
// nothing else in the validator needs to change per-entity.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export const FEATURE_ROOTS = [
  'src/features/properties',
]

export const SHARED_PRIMITIVES_ROOT = 'src/components/shared'
export const SHARED_FRAMEWORK_ROOT = 'src/shared/detail-view'

// Per-feature layer subpaths (relative to each entry in FEATURE_ROOTS).
export const LAYER_SUBPATHS = {
  viewModels: 'view-models',
  sections: 'components/sections',
  mappers: 'lib/mappers',
  repositories: 'repositories',
  services: 'services',
  types: 'types',
}

// Node-builtin / third-party import specifiers that count as "React /
// UI library" for ViewModel-purity purposes. Matched by exact string or
// prefix (entries ending in "/" match any subpath).
export const UI_LIBRARY_IMPORTS = [
  'react', 'react-dom', 'react/jsx-runtime',
  'next', 'next/',
  'lucide-react',
  'radix-ui', '@radix-ui/',
  '@/components/', 'src/components/',
]

// Import specifiers that count as "React hooks" by call-expression name,
// as defense in depth against a namespace import bypassing the
// specifier-based check above (e.g. `import * as React from 'react'`).
export const REACT_HOOK_CALL_PATTERN = /^use[A-Z]/

export const EXCEPTIONS_FILE = path.join(REPO_ROOT, 'scripts/architecture-validator/exceptions.json')

// Fields on RealEstateProperty that are legitimately never meant to reach
// the Details page's ViewModel layer (internal/system bookkeeping, or
// fields consumed only by the list page / repositories / write-path
// validation, never displayed on the read-only details page). Excluded
// from the field-coverage rule's "orphan field" report so that rule
// reports genuine gaps, not this rule's own predictable, already-reviewed
// noise floor.
export const FIELD_COVERAGE_ALLOWLIST = new Set([
  'id', 'deleted', 'createdAt', 'modifiedAt', 'createdById', 'createdByName',
  'modifiedById', 'modifiedByName', 'versionNumber',
  // Verified against property.types.ts's own comment (not assumed): "a
  // legacy composite nothing in EspoCRM's own UI surfaces ... Not open
  // technical debt anymore; a documented, intentional shadow-write."
  // `address` is canonical; this field is write-path-only by design.
  'cLocationRealCity',
  // List-page-only filter/sort scaffolding (PropertyFilters/SortOption/etc.
  // live in the same file but aren't RealEstateProperty fields; excluded
  // defensively in case future edits blur the line).
])
