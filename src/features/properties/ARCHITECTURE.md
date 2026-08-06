# Details Page Architecture

This is the reference implementation for every Details page in this product
(Property today; Contact/Company/Employee/Vehicle/Project next). It exists
so a future entity's Details page can be built by writing **ViewModels,
Mappers, Formatters, and Configuration** — never by re-deriving this
pattern from scratch, and never by copy-pasting JSX.

If you're building a new Details page: read this file first, then look at
`src/features/properties/` as the worked example. Copy the *shape*, not
the code.

## The five layers

```
Container            "What data does this page need, and in what shape?"
  ↓ builds
ViewModel             Pure data. No React. No icon imports. No JSX.
  ↓ (built by a Mapper, formatted by a Formatter — see below)
Presentational        Takes a ViewModel prop. Never imports the entity model.
Component              Resolves icons/config locally (that's a UI concern).
```

Two layers cut across all of them:

- **Mapper** — a pure function that shapes raw entity fields into a
  ViewModel's data (`buildOptionalRows`, `buildDedupedImageList`,
  `getCommandHubStatusDotClass`, …). Lives in `lib/mappers/` (entity-scoped
  vocabulary) or `src/shared/detail-view/` (entity-agnostic).
- **Formatter** — a pure function that turns one value into display text
  (`formatDateGB`, `fmtPrice`, `joinAddressParts`). Same two possible
  homes, same rule for which one.

## Where things live

```
src/shared/detail-view/        Entity-agnostic data utilities. If a Contact
                                 Details page would want the exact same
                                 function unchanged, it belongs here — not
                                 under features/properties/.
                                 (rows, date/address formatters, image-list
                                 dedup, attachment-is-image, slug, PillTone)

src/components/shared/         Entity-agnostic presentation primitives.
                                 Same rule: if a Contact page could render
                                 this component unchanged (just fed
                                 different data), it belongs here.
                                 (SectionHeader, EmptyState, AvatarInitial,
                                 DefinitionList, InfoRow, TonePill,
                                 MediaLightbox)

src/features/properties/
  view-models/                  One file per section. Exports a
                                 `<Section>ViewModel` interface and a
                                 `build<Section>ViewModel(property, ...)`
                                 function. Data only.
  lib/mappers/                  Entity-vocabulary mapping that will never
                                 be identical for another entity (Property's
                                 8-value status enum, its bucket colors).
  lib/                           Formatters/mappers older than this pass,
                                 kept where they are (display.ts,
                                 property-narrative.ts, ...).
  components/sections/          One file per section, named to match its
                                 ViewModel. Takes `{ viewModel: XViewModel }`
                                 (see the one exception below).
  components/PropertyDetailView.tsx
                                 The container. Builds every ViewModel,
                                 composes every section, owns page layout —
                                 this file is NOT reusable across entities;
                                 a Contact Details page has its own.
```

## The mandatory pattern

**Every section follows this, no exceptions without a documented reason:**

```ts
// view-models/financial.viewmodel.ts — DATA ONLY
export interface FinancialViewModel {
  price?: number
  pricePerSqm: number | null
  detailClusters: FinancialDetailCluster[]
  // ...
}

export function buildFinancialViewModel(property: FinancialFields): FinancialViewModel {
  // field selection, calculation, formatting — all of it happens here
}
```

```tsx
// components/sections/FinancialIntelligenceOS.tsx — PRESENTATION ONLY
export function FinancialIntelligenceOS({ data }: { data: FinancialViewModel }) {
  // renders. Never imports RealEstateProperty. Never computes a fact.
}
```

```tsx
// components/PropertyDetailView.tsx — THE CONTAINER
<FinancialIntelligenceOS data={buildFinancialViewModel(property)} />
```

### Rule: no icons or static config in a ViewModel

An icon is a UI-library binding (`lucide-react`); a future non-React
consumer of the same ViewModel couldn't use it. When a ViewModel needs to
express "this row should show icon X," it emits a **semantic key** instead,
and the component resolves the key to an icon locally:

```ts
// construction.viewmodel.ts
export type ConditionBadgeKey = 'needs-renovation' | 'renovated' | 'under-construction'
export interface ConditionBadgeViewModel { key: ConditionBadgeKey; label: string; tone: PillTone }
```

```tsx
// ConstructionSystemsCard.tsx
const CONDITION_ICON: Record<ConditionBadgeKey, LucideIcon> = {
  'needs-renovation': Wrench, 'renovated': Sparkles, 'under-construction': HardHat,
}
```

The same rule applies to editorial copy that isn't data-derived (tab
labels, static config like `TAB_CONFIG` in `LocationIntelligenceCenter.tsx`)
— it's presentation configuration, so it lives in the component, not the
ViewModel.

### The one documented exception: components that own async data

`LocationIntelligenceCenter.tsx` takes `property: RealEstateProperty`
directly instead of a ViewModel. This is deliberate, not an oversight: it
owns `usePropertyLocation`/`useNearbyPlaces` (React Query hooks fetching
geocoding + nearby-places data), and needs raw property fields to build
those queries *before* any ViewModel could exist. `RelatedPropertiesSection.tsx`
is the same category (owns its own `useQuery` for related listings).

If you're building a new section and it needs to fetch its own data, this
is the precedent — but the pure-data parts of what it computes (see
`location.viewmodel.ts`'s `countNearbyByCategory`, `resolveActiveTab`,
`resolveMapCoords`) should still be pulled out into a ViewModel-layer
function so they're independently testable, even though the component
itself keeps the raw entity prop.

## Extracting a shared primitive: the bar is *verified* duplication

Before promoting a pattern to `src/components/shared/`, read the real
source of every candidate call site and diff the actual class strings —
don't extract from memory or a description. Two patterns that look the
same from a distance are often not: `ConditionBadge` and `FeatureBadge`
were mergeable into `TonePill` because their `positive` tone was
byte-identical; three "empty state" patterns on this same page were
**not** merged into `EmptyState` because their icon shapes, sizes, and
layouts genuinely differ (see `EmptyState.tsx`'s own note) — forcing that
merge would have silently changed rendered pixels, which is exactly what
this architecture exists to prevent.

If a pattern only has one real usage site today, it usually doesn't
belong in `components/shared/` yet — wait for the second, real, verified
instance (see `ConstructionSystemsCard.tsx`'s `SystemTile`, deliberately
kept local for this reason).

## Building a new entity's Details page

1. Look at `PropertyDetailView.tsx` for the container shape — you're
   writing your own version of this file, not reusing Property's.
2. For each section you need, write `<section>.viewmodel.ts` following the
   pattern above. Reuse `src/shared/detail-view/` utilities wherever the
   shape matches (`buildOptionalRows`, `formatDateGB`, …) — don't
   re-implement them.
3. Reuse `src/components/shared/` primitives directly — `SectionHeader`,
   `EmptyState`, `TonePill`, `DefinitionList`, `InfoRow`, `AvatarInitial`,
   `MediaLightbox` all render your entity's data with zero changes, because
   they never knew about `RealEstateProperty` to begin with.
4. Only write a new presentational component when the *visual shape* is
   genuinely new — not because the data source changed.
5. Entity-specific vocabulary (a Contact's own status enum, its own field
   labels) goes in that entity's own `lib/mappers/` — same as Property's
   `status-presentation.ts` — never into `src/shared/`.

## Enforcement

Four ESLint rules in `eslint.config.mjs` fail the build if this pattern is
violated:

- A ViewModel imports React/Next — blocked.
- A ViewModel imports an icon library — blocked.
- A ViewModel imports from `components/` — blocked.
- A presentational section component imports `RealEstateProperty` directly
  (outside the documented async-data exceptions) — blocked.
- Anything in `components/shared/` or `shared/detail-view/` imports from
  `features/**` — blocked.

Run `npx eslint src/features/properties src/components/shared
src/shared/detail-view` to check locally; CI runs the same command.
