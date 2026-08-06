# Architecture Validator

A dedicated static-analysis tool (not ESLint, not grep) that proves the
Details-page framework documented in
`src/features/properties/ARCHITECTURE.md` stays correct as the codebase
changes. Built on the TypeScript compiler API (`typescript`, already a
project dependency) for real AST parsing — no new dependency added.

```
npm run validate:architecture          # human-readable report, exit 1 on violation
npm run validate:architecture:json     # machine-readable, for tooling/CI artifacts
```

Runs automatically in CI on any PR touching the Details-page framework
(`.github/workflows/architecture-validation.yml`).

## Rules

| Rule | What it proves | How |
|---|---|---|
| `layer-direction` | Presentation never imports repositories/services directly; Mappers never import components; ViewModels never import section components | Import-specifier pattern match against each layer's real folder |
| `entity-leakage` | Presentational section components never receive the entity model directly, except documented exceptions | Scans named imports of every exported interface in `types/` (minus DTO/Ref/Option/Filters shapes) against `exceptions.json` |
| `viewmodel-purity` | ViewModels contain data only | Checks for UI-library imports, JSX syntax, hook-shaped call expressions, and Tailwind class strings in every `view-models/*.ts` file |
| `shared-isolation` | `components/shared/` and `shared/detail-view/` never import feature-specific code | Import-specifier pattern match |
| `dependency-graph` | No circular dependencies | Builds a real import graph over the framework's files and runs DFS cycle detection (three-color algorithm) |
| `field-coverage` | Every `RealEstateProperty` field is referenced somewhere in the data layer | Extracts entity interface members, `Pick<>` literals, `property.field` accesses, and destructuring across `view-models/`, `lib/`, and documented async-data-owner exceptions |
| `enum-coverage` | Every `PropertyStatus` value is explicitly handled by its dedicated presentation mapper | Extracts the union's literal values and the mapper's compared/keyed string literals |
| `duplication` | Surfaces (as warnings, not failures) ViewModel shapes or presentation class-name sets that overlap heavily | Jaccard similarity over field-name sets and literal `className`/`cn()` string sets |

### Semantic layer (intra-procedural provenance)

Extends the structural rules above with real (not name-guessed) dataflow
tracing, via `semantic.mjs`'s `traceViewModelBuilders()` — for every
`build<X>ViewModel` function, traces each field of its returned object back
to the entity field(s) it derives from, resolving one local-variable hop
and one formatter-call wrapper. Bounded and stated honestly below, not
oversold.

| Rule | What it proves | How |
|---|---|---|
| `viewmodel-consumption` | Every ViewModel field reaches a real consumer — no field is declared and never read | Resolves each component's actual `viewModel`/`data` prop type (not any `*ViewModel`-suffixed name in the file — see `getComponentViewModelPropTypeName`'s own note on the false-positive class that distinction fixes), then diffs the interface's members against what the component destructures/accesses |
| `duplicate-transform` | A ViewModel's already-formatted output is never formatted a second time in the component | Matches a component's call-expression's leading-identifier argument against a ViewModel field the provenance trace already proved was produced by that same formatter |
| `field-lineage` | Informational — the real "semantic graph": entity field → transform → ViewModel key → consuming component, for every traceable field | Chains `traceViewModelBuilders()`'s output to `getComponentViewModelPropTypeName()`'s resolution; `npm run validate:architecture -- --graph` dumps it as JSON |

## Honest scope limits

This tool does real, verifiable syntactic and intra-procedural analysis.
It does **not** do full symbolic execution, points-to analysis, or
formatter-output correctness checking — several things requested of a
"complete" semantic validator were deliberately not attempted rather than
faked, because building them honestly would require a fundamentally
different (and much larger) class of tool:

- **Field-to-JSX lineage past the ViewModel boundary.** `field-lineage`
  proves entity field → ViewModel key, and `viewmodel-consumption` proves
  ViewModel key → *some* access in the consuming component. Neither traces
  further into the component's own JSX to a specific rendered DOM node —
  that's where syntactic tracing runs out and real dataflow/points-to
  analysis (the kind CodeQL or a TS-`Program`-backed tool does, still
  imperfectly) would be needed.
- **Formatter output correctness.** This tool can prove `price` (or a
  value derived from it) reached `formatCurrency(...)` — it cannot prove
  `formatCurrency(250000)` produces the *correct* string `"$250,000"`.
  That is exactly what this project's own unit tests already assert on
  real input→output pairs (see `financial.viewmodel.test.ts`, generated
  independently of this validator) — the right tool for that job, not a
  second, weaker static approximation of it.
- **Determinism verification.** Whether a derived value's logic is
  deterministic is not a syntactically decidable property for arbitrary
  code; not checked, not claimed.
- **Cross-mapper enum "identical meaning."** Deliberately *not* built as a
  rule: `getHeroStatusFillClass` and `getCommandHubStatusDotClass` use
  different status-bucket boundaries **on purpose** (documented in
  `status-presentation.ts`'s own header comment) — a rule that failed CI
  whenever two status mappers disagree would break correct, intentional
  code. `enum-coverage` instead verifies each mapper is *internally*
  complete (every enum value explicitly handled), which is the check that
  doesn't fight the architecture.
- **Conditional-branch reachability.** "Is this `if` branch ever actually
  exercised by real data" is a runtime-coverage question, not a static
  one. The honest tool for this is branch-coverage instrumentation
  (`vitest run --coverage`, already configured in this repo) with a
  threshold gate — not something bolted onto this validator.

All of these are named here so they're a visible, tracked gap rather than
an implied-but-missing capability.

## Adding a new entity's Details page to this validator

Add the new feature root to `FEATURE_ROOTS` in `config.mjs` — every rule
iterates that list, so a Contact/Company/Vehicle Details page built with
the same `view-models/` + `components/sections/` folder shape as
`properties/` is covered with a one-line change, not a new rule set.

## Documented exceptions

Live in `exceptions.json`, not scattered inline comments — one file a
reviewer can read to see every approved deviation from the default rules,
with a reason and the pass that approved it. `entity-leakage` and
`layer-direction` both cross-check their exception lists and flag a
*stale* exception (one that no longer matches what the file actually does)
as its own finding, per the "a documented exception changes" requirement.
