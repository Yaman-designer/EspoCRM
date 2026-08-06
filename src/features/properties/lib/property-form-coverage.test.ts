import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

// ── Property Form ↔ Property Details coverage gate ──────────────────────────
// Enterprise Data Integrity & Coverage Audit (2026-07-23). The Property Form
// Wizard (7 steps, src/app/(dashboard)/properties/new/steps/*.schema.ts) and
// the read-only Property Details page evolved independently across many
// passes of this engagement; nothing previously guaranteed a field added to
// one side would ever be noticed missing from the other. This test is that
// guarantee, made mechanical: it statically extracts every field name the
// Wizard can capture and fails, by name, if a field isn't referenced anywhere
// in the Details-page source tree and isn't in the explicit, documented
// EXCEPTIONS list below. Add a Wizard field, forget to surface it on
// Details, and this test fails on the very next run — no live server, no
// manual audit, no screenshot review required.
//
// What this test is, and isn't:
//  - It IS a static text-presence check: a field is "covered" if its exact
//    name (word-boundary matched, so `floor` cannot false-positive on
//    `floorCount`) appears anywhere in the Details-page source tree below.
//  - It is NOT a runtime/DOM proof that the field is actually rendered to
//    the screen for a real record — a field name inside a comment would
//    also count as "covered". That tradeoff is deliberate: a false pass
//    (rare — everything actually referenced this way was independently
//    verified during the audit that produced this test) is far less
//    dangerous for a CI gate than a false fail on every unrelated PR, which
//    a full render-and-inspect approach would risk without a live backend.
//  - The threat model this exists for is explicit and narrow, per the audit
//    that requested it: "a new Property Form field is added without being
//    represented in Details." That is exactly what it catches.

const SCHEMA_DIR = join(process.cwd(), 'src/app/(dashboard)/properties/new/steps')
const SCHEMA_FILES = [
  'identity-governance.schema.ts',
  'location-zoning.schema.ts',
  'pricing-terms.schema.ts',
  'size-rooms-structure.schema.ts',
  'construction-systems.schema.ts',
  'outdoor-building-amenities.schema.ts',
  'marketing-media.schema.ts',
]

// The Details-page source tree — everything a real field could be surfaced
// through. Deliberately broad (the whole properties feature's presentation +
// view-model + shared-mapper layers) rather than a hand-maintained file list,
// so relocations (this engagement has moved mapper files at least twice)
// never produce a false "field disappeared" failure of their own.
const DETAILS_SOURCE_ROOTS = [
  join(process.cwd(), 'src/features/properties/components'),
  join(process.cwd(), 'src/features/properties/view-models'),
  join(process.cwd(), 'src/features/properties/lib'),
  join(process.cwd(), 'src/shared/detail-view'),
]

// Fields the Wizard can capture that are intentionally, documentedly, never
// displayed on Property Details. Every entry here was individually verified
// during the 2026-07-23 audit — this is not a place to silence a real gap;
// adding an entry without a real, checkable reason defeats the entire point
// of this test.
//
// `title` was originally listed here on the assumption that it's fully
// superseded by `propertyCode` (EspoCRM overwrites `title` to match
// `propertyCode` server-side on every save) and therefore never itself
// read. This test's own "stale exception" check disproved that: `title` IS
// read directly — display.ts's getDisplayName() is `property.title ||
// property.name`, feeding the Hero's headline, the breadcrumb, and the
// page slug. It reliably displays the same text as propertyCode only
// because of the server-side overwrite, not because the Details page
// ignores the field. Removed from this list — it is genuinely covered, not
// an exception — precisely the kind of self-correction this test exists to
// force rather than let a manual audit's claim go unverified.
const EXCEPTIONS: Record<string, string> = {}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full)
  }
  return out
}

function extractFormFields(): string[] {
  const fieldPattern = /\bfield\.\w+\(\s*'([a-zA-Z0-9]+)'/g
  const names = new Set<string>()
  for (const file of SCHEMA_FILES) {
    const text = readFileSync(join(SCHEMA_DIR, file), 'utf8')
    for (const match of text.matchAll(fieldPattern)) names.add(match[1])
  }
  return [...names].sort()
}

function buildDetailsSourceCorpus(): string {
  const files = DETAILS_SOURCE_ROOTS.flatMap(root => walk(root))
    // Exclude this test file itself and other coverage/regression tests —
    // a field name appearing only in a *test's own field list* must not
    // count as "covered" by the real Details-page source.
    .filter(f => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
  return files.map(f => readFileSync(f, 'utf8')).join('\n')
}

function isFieldReferenced(field: string, corpus: string): boolean {
  const boundary = new RegExp(`(?<![A-Za-z0-9_])${field}(?![A-Za-z0-9_])`)
  return boundary.test(corpus)
}

describe('Property Form -> Property Details field coverage', () => {
  const formFields = extractFormFields()
  const corpus = buildDetailsSourceCorpus()

  it('extracted a non-trivial field list from the Wizard schema files (sanity check on the parser itself)', () => {
    // Guards against a silently-broken regex/path producing a vacuously
    // "passing" empty list — this project's Wizard has ~90 real fields
    // across its 7 steps; anything far short of that means this test is
    // no longer reading what it thinks it's reading.
    expect(formFields.length).toBeGreaterThan(80)
  })

  it('every Property Form field is either displayed on Details or a documented exception', () => {
    const missing = formFields.filter(field => (
      !(field in EXCEPTIONS) && !isFieldReferenced(field, corpus)
    ))

    expect(
      missing,
      missing.length > 0
        ? `${missing.length} Property Form field(s) have no representation anywhere in the Details-page source and no documented exception: ${missing.join(', ')}. ` +
          `Either surface the field on Property Details, or add a named, reasoned entry to EXCEPTIONS in property-form-coverage.test.ts — never silently ignore this failure.`
        : undefined,
    ).toEqual([])
  })

  it('every documented exception is still a real, currently-unreferenced field (catches stale exceptions)', () => {
    // If a field later DOES get displayed (e.g. a future pass adds it), its
    // EXCEPTIONS entry becomes a stale lie about the page's real coverage —
    // this fails loudly so the entry gets removed instead of quietly
    // misdescribing the page forever.
    const staleExceptions = Object.keys(EXCEPTIONS).filter(field => isFieldReferenced(field, corpus))
    expect(
      staleExceptions,
      staleExceptions.length > 0
        ? `${staleExceptions.join(', ')} ${staleExceptions.length === 1 ? 'is' : 'are'} listed in EXCEPTIONS as never displayed, but now ${staleExceptions.length === 1 ? 'is' : 'are'} referenced in the Details-page source — remove the stale exception entry.`
        : undefined,
    ).toEqual([])
  })

  it('every field name in EXCEPTIONS actually exists in the Wizard schema (catches typos/dead entries)', () => {
    const unknownExceptions = Object.keys(EXCEPTIONS).filter(field => !formFields.includes(field))
    expect(unknownExceptions).toEqual([])
  })
})

// ── ViewModel -> Component orphan gate ──────────────────────────────────────
// Second, independent threat model: a field can be added to a ViewModel's
// exported interface (e.g. someone starts computing a new value in
// financial.viewmodel.ts) without its rendering component ever actually
// reading it — a silent no-op that the coverage gate above cannot see,
// since the *Wizard* field feeding that ViewModel may already be covered by
// some other section. Each pair below is an explicit, human-verified
// ViewModel-interface -> rendering-component mapping (not inferred), so this
// stays honest about exactly what relationship it checks.
const VIEWMODEL_COMPONENT_PAIRS = [
  { viewModelFile: 'view-models/operations.viewmodel.ts', interfaceName: 'OperationsViewModel', componentFile: 'components/sections/OperationsCommandHub.tsx' },
  { viewModelFile: 'view-models/financial.viewmodel.ts', interfaceName: 'FinancialViewModel', componentFile: 'components/sections/FinancialIntelligenceOS.tsx' },
  { viewModelFile: 'view-models/assets.viewmodel.ts', interfaceName: 'AssetsViewModel', componentFile: 'components/sections/AssetManagementSystem.tsx' },
  { viewModelFile: 'view-models/timeline.viewmodel.ts', interfaceName: 'TimelineViewModel', componentFile: 'components/sections/PropertyTimeline.tsx' },
  { viewModelFile: 'view-models/location.viewmodel.ts', interfaceName: 'AddressCoordinatesViewModel', componentFile: 'components/sections/AddressCoordinatesPanel.tsx' },
  { viewModelFile: 'view-models/detail-page.viewmodel.ts', interfaceName: 'PropertyDetailPageViewModel', componentFile: 'components/PropertyDetailView.tsx' },
] as const

const PROPERTIES_ROOT = join(process.cwd(), 'src/features/properties')

/** Top-level field names of a named `interface X { ... }` block, via brace counting (handles nested object-type fields without needing a full parser). */
function extractInterfaceFields(text: string, interfaceName: string): string[] {
  const start = text.indexOf(`interface ${interfaceName}`)
  if (start === -1) throw new Error(`interface ${interfaceName} not found`)
  const openBrace = text.indexOf('{', start)
  let depth = 0
  let end = openBrace
  for (let i = openBrace; i < text.length; i++) {
    if (text[i] === '{') depth++
    if (text[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  const body = text.slice(openBrace + 1, end)
  const fieldPattern = /^\s*([a-zA-Z][a-zA-Z0-9]*)\??:/gm
  return [...body.matchAll(fieldPattern)].map(m => m[1])
}

describe('ViewModel -> rendering component field coverage', () => {
  for (const { viewModelFile, interfaceName, componentFile } of VIEWMODEL_COMPONENT_PAIRS) {
    it(`every field of ${interfaceName} is referenced in ${componentFile}`, () => {
      const vmText = readFileSync(join(PROPERTIES_ROOT, viewModelFile), 'utf8')
      const componentText = readFileSync(join(PROPERTIES_ROOT, componentFile), 'utf8')
      const fields = extractInterfaceFields(vmText, interfaceName)

      expect(fields.length).toBeGreaterThan(0)

      const orphaned = fields.filter(f => !isFieldReferenced(f, componentText))
      expect(
        orphaned,
        orphaned.length > 0
          ? `${interfaceName} field(s) never referenced in ${componentFile}: ${orphaned.join(', ')}. Either wire the field into the component, or remove it from the ViewModel.`
          : undefined,
      ).toEqual([])
    })
  }
})
