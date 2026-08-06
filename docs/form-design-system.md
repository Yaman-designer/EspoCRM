# Form Design System

**Status:** Established — single source of truth as of 2026-07-27, extended
2026-08-05. Any new form field, wrapper, layout container, or Popover-driven
trigger in this app must consume the primitives below. Do not hand-roll a
replacement, even a small one.

**Origin:** Property Wizard ↔ Pipeline field-parity consolidation
(2026-07-27). Both `framework/form-engine` (the Wizard) and
`components/dynamic-form` (Pipeline, Calls, Companies, Contact, Contracts,
Requests, the Properties list's quick-form) were found to already share the
same base control primitives (`components/ui/input.tsx`, `textarea.tsx`,
`switch.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`) — the visible
divergence was per-consumer className drift away from those tokens, plus four
independently hand-rolled Popover comboboxes that never received the same
treatment. This document exists so that convergence holds as new field types
and CRM modules are added, instead of quietly re-diverging.

**2026-08-05 extension — origin:** two responsive-architecture reviews of the
Property Wizard's bottom action bar and its full field system. The first
found and fixed a footer layout that broke specifically where a viewport-width
breakpoint disagreed with the panel's own rendered width (the dashboard
sidebar eats part of the viewport a `md:`/`lg:` class can't see). The second
found and fixed a real, live bug: a long selected value in any Select/Combobox
field hard-clipped mid-word with **no ellipsis** — confirmed via a headless
browser, not inferred from reading the code — because `ComboboxTrigger`'s own
`truncate` is on a flex wrapper, and CSS `text-overflow` cannot ellipsize
overflow caused by a *nested child's* box, only a box's own inline content.
Both bugs share one shape: an implicit sizing assumption (a viewport
breakpoint standing in for actual available width; a wrapper's `truncate`
standing in for a leaf's own truncation) that held everywhere it happened to
be tested and broke exactly once content or context stopped matching that
assumption. This extension exists so the next person adding a field, a grid
tier, or a layout container has the *rule*, not just the two bugs it was
inferred from.

## System map

Five layers, each only allowed to know about the one below it:

1. **Base control primitives** (`components/ui/input.tsx`, `textarea.tsx`,
   `switch.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`,
   `popover.tsx`, `command.tsx`, `calendar.tsx`, `button.tsx`'s `outline`
   variant). Own the actual control's border/height/radius/shadow/ring. Never
   overridden per-consumer — see Design tokens below.
2. **`FormFieldShell`** and **`ComboboxTrigger`** (this document's subject).
   Own everything around a control that's identical regardless of which
   control it is.
3. **Engine adapters** — `framework/form-engine/FieldWrapper.tsx` and
   `components/dynamic-form/DynamicForm.tsx`'s `DynamicFormFieldRow`. Each
   resolves its own engine's config/schema/i18n into plain strings, then
   renders layer 2.
4. **Field components** — `TextField.tsx`, `FormInput.tsx`,
   `SearchableSelectField.tsx`, `FormDatePicker.tsx`, etc. Own field-type
   behavior (debounced search, date parsing, prefix/suffix decoration) and
   compose layers 1–2.
5. **Layout orchestration** — `GridEngine` and `SectionRow`
   (`framework/form-engine/section-primitives.tsx`). Own how many layer-4
   fields/sections appear per row and how much horizontal space each gets.
   Sits *around* layer 4, not below it — a field component never queries its
   own grid position; layout is decided above it and handed down purely as
   rendered width. This is also the layer the 2026-08-05 extension is mostly
   about, since a layout container's job is entirely "decide how much room
   layer 4 gets," and every bug found in that review was a case of the room
   being miscalculated, not the field misusing room it was correctly given.

## Design System Rules

Every shared component below exists to make these ten rules hold *without*
each field component having to re-derive them. A new field, wrapper, or
layout container that violates one of these is not a style choice — it's a
regression, even if nothing currently visible looks wrong. Each rule cites
where it's actually enforced today and, where relevant, the real bug that
made the rule explicit rather than assumed.

1. **Respect container width, not viewport width.** Every column/tier
   decision in this system (`GridEngine`'s field spans, `SectionRow`'s 2-up
   tiers) is a *container* query (`@container` + `@md`/`@2xl`/`@4xl`), never a
   viewport breakpoint (`md:`/`lg:`). A field or section renders at different
   widths depending on where it's composed (a full-width step body vs. a
   narrow side-by-side card), and only the container it actually sits in
   knows which. *Enforced:* `GridEngine.tsx`'s own `@container` wrapper;
   `utils.ts`'s `getGridClasses` (`@md`/`@2xl`/`@4xl`, never `md:`/`lg:`/`xl:`);
   `section-primitives.tsx`'s `ROW_2UP`/`ROW_SIDEBAR` maps. *Why this is a
   hard rule, not a preference:* the Wizard footer (a sibling system, not
   itself a form field, but the same underlying class of bug) broke exactly
   here — a `md:` viewport breakpoint had no way to know the dashboard's
   persistent sidebar had already eaten part of that viewport, and rendered
   its wide layout into a container that was actually ~220px too narrow for
   it. Confirmed live, not theoretical.

2. **Use intrinsic sizing — `minmax(0,1fr)`, not `1fr` alone.** Every grid
   track in this system must be able to shrink to `0` as its floor, with the
   *content* (not the track) deciding the real floor via `min-w-0` +
   `truncate`/wrapping. *Enforced:* Tailwind's own `grid-cols-N` utilities
   already compile to `repeat(N, minmax(0, 1fr))` (verified against the
   compiled CSS) — `GridEngine`'s 12-column grid and `SectionRow`'s 2-up grids
   get this for free from the framework and must not be hand-overridden to a
   bare `1fr`.

3. **Never force parent width.** A field's rendered width is an output of
   the grid cell it was given, never an input the field asserts back upward.
   No field component sets a fixed or `min-w` wider than its container can
   guarantee. *Enforced:* `Input`/`Textarea`/`ComboboxTrigger` are all
   `w-full`; `GridEngine` wraps each field in a plain `col-span-N` div with no
   competing width.

4. **Never `w-fit`/`fit-content`/`max-content` unless the sizing is
   genuinely intentional and bounded.** Sizing a control to its own content
   is only safe when that content is itself bounded (an icon-only button, a
   fixed-vocabulary badge) — anything that can hold a real, unbounded,
   translated, or user-authored string must not use it. *Known, deliberate
   exception:* `ui/select.tsx`'s own `SelectTrigger` (Radix `Select`, not
   `ComboboxTrigger`) is `w-fit` — this is fine only because nothing in this
   form system currently routes a field through it (see the ComboboxTrigger
   section's "Not a ComboboxTrigger consumer" note); if a future field ever
   does route through `ui/select.tsx`'s trigger, this exception must be
   revisited, not copied.

5. **Never rely on viewport width for anything content-driven.** Restated
   from rule 1 because it is the single most common way this class of bug
   reappears: `sm:`/`md:`/`lg:` are correct for page-chrome decisions (the
   dashboard shell, the wizard footer's own safe-area padding) but never
   correct for "does this row/field have enough room," because a field or
   section's actual container is frequently narrower or wider than the
   viewport implies.

6. **Support RTL via logical properties, not manual mirroring.** `ms-`/`me-`
   (never `ml-`/`mr-`), `ps-`/`pe-` (never `pl-`/`pr-`), `text-start` (never
   `text-left`), `rounded-s-*`/`rounded-e-*` (never `rounded-l-*`/`rounded-r-*`
   for a directionally-meaningful corner). CSS Grid and Flexbox already
   mirror column order for free under `dir="rtl"` — do not add manual
   `flex-row-reverse` or reordering logic to "help." Any directional icon
   (a chevron, an arrow) needs an explicit `rtl:rotate-180` (or equivalent),
   since an icon's *meaning* — not just its layout position — needs to flip.
   *Caveat this app must not forget:* `dir` is hard-coded to `"ltr"` in
   `app/layout.tsx` and no Arabic (or other RTL) locale ships today — every
   logical-property fix in this system is verified by manually forcing
   `dir="rtl"` in a test harness, not by exercising it through the running
   app. That gap is real and is *not* closed by this document; it's an
   app-shell-level prerequisite (locale + `dir` wiring) that has to land
   before "this form supports RTL" is a true statement end-to-end, not just
   "this form is RTL-ready whenever that lands."

7. **Support zoom.** Nothing in this system may depend on `window.innerWidth`
   in device pixels or assume a 1:1 relationship between viewport size and
   available space — container queries (rule 1) already make this hold,
   since browser zoom is layout-equivalent to a narrower/wider effective
   viewport in CSS px, which a container query reads correctly regardless of
   *why* the container is that width.

8. **Support accessibility as a structural property, not a pass at the
   end.** A field is not done when it looks right — every control needs a
   real DOM `id` connected via `htmlFor`, `aria-describedby` pointing at
   whichever of helper/error text is currently showing (error wins, never
   both), `aria-invalid` on both the shell wrapper and the real control, and
   text contrast that survives at whatever opacity it's actually rendered
   at (not just its base color's contrast — a muted color at reduced opacity
   can independently fail contrast even when the base color passes at full
   strength). See the Accessibility contract section below for the full,
   current wiring.

9. **Support long, localized values without clipping or overflowing.** Every
   value-bearing leaf — a selected option's label, a formatted date, a
   related record's name, an error or helper message — must resolve to
   `min-w-0` plus either `truncate` (single-line controls) or natural
   wrapping (multi-line text like helper/error copy), applied at the actual
   leaf holding the text, not assumed to be inherited from an ancestor's
   `truncate`. *This is the rule the 2026-08-05 `ComboboxTrigger` fix exists
   to enforce* — see that section for the full mechanism and why "the
   wrapper already has `truncate`" was not sufficient.

10. **A field never queries its own layout position.** No field component
    reads its grid column, its container's breakpoint tier, or anything else
    about where it's been placed — layout is handed down as rendered pixels
    (the width the field's own DOM node ends up with), and the field's only
    job is to behave correctly *given* that width, via rules 2–4 above. This
    is what keeps layer 4 (field components) and layer 5 (layout
    orchestration) from becoming entangled as new field types and new grid
    tiers are added independently of each other.

## FormFieldShell — `src/components/ui/form-field-shell.tsx`

**Purpose.** Be the one place "what does a labeled field look like" is
decided, independent of which control it wraps or which form engine renders
it — so a Wizard text field and a Pipeline select field are visually
identical around the control even though nothing else about how they're
built is shared.

**Responsibilities:**
- Label row: label text, required asterisk, read-only pill, tooltip trigger.
- Description row (rendered between the label and the control).
- The control slot itself — a plain wrapper div around `children` carrying
  `aria-describedby` / `aria-required` / `aria-invalid`.
- Bottom row: error message *or* helper text (error always wins), plus an
  optional character counter when both `charCount` and `maxLength` are given.

**Explicitly not its job:** i18n (no `useTranslation`, no key resolution —
every string arrives pre-resolved by the caller), any specific form library
(no RHF/Controller/Zod import), the actual control's own markup or styling.

**Assumptions it makes:**
- Every string prop (`label`, `helperText`, `error`, etc.) is already resolved
  plain text in the *current* locale — the shell does zero translation and
  will render a raw i18n key verbatim if a caller forgets to resolve one.
- `id` is the real DOM id that will end up on the actual interactive control,
  not a wrapper — the shell's label uses `htmlFor={id}` and its
  `aria-describedby` computation is only correct if the control the user
  actually focuses shares that id.
- The bottom row (error/helper/counter) can wrap to multiple lines without
  breaking anything above it — it does not reserve a fixed single-line
  height, by design (see "must never be simplified" below).

**Assumptions consumers must satisfy:**
- Apply `getFieldDescribedBy(schema, error)` (or the equivalent) to the real
  control's own `aria-describedby`, not just rely on the shell's wrapper div
  — screen readers compute a control's description from the *focused
  element's own attributes*, not an ancestor's.
- Pass `reserveLabelSpace` for any control that draws its own inline label
  (switch/checkbox) instead of silently skipping the label row — omitting
  this was a real, fixed defect (a switch's control sat ~24px higher than a
  labeled peer's in the same row) before this flag existed.

**Common mistakes:**
- Building a bespoke label/required/helper/error block for "just this one
  field" instead of composing the shell — this is the exact drift this
  document exists to stop; see the Origin section's `InfoRow` /
  `DefinitionList` precedent for how quickly two near-identical
  hand-rolled versions of the same thing stop agreeing with each other.
- Putting `aria-describedby`/`aria-invalid` only on the shell's wrapper `div`
  and assuming that's sufficient — it is not; see "Assumptions consumers
  must satisfy" above.
- Reaching for a fixed `min-h-*` on the bottom row to "stop layout shift"
  when an error appears — this reintroduces dead space on every field that
  never shows helper/error text; the actual, already-solved version of this
  is `sm:min-h-4` + `max-sm:hidden` (present only where multi-column
  alignment needs it, collapsed away on mobile where it would just be empty
  space).

**Anti-patterns:**
- A second, parallel "compact" or "inline" field shell for a layout that
  feels too tight for the standard one — the standard shell's label/error
  rows are already sized for the tightest real layout in the app (the
  Identity step's narrow side-by-side cards); a new shell is very likely
  solving a spacing preference, not a genuine structural need.
- Passing pre-formatted HTML or rich content as `error`/`helperText` — both
  render as plain text content inside a `<p>`; anything requiring markup
  belongs in the field component's own body, not the shell's bottom row.

**Why the current implementation exists:** promoted from what was
previously two independent, silently-diverging implementations
(`getFieldSummary` inside `SectionRenderer.tsx`, `getSectionCompletion`
inside `IdentityGovernanceStepView.tsx`'s `CompactSectionCard`) — see the
System map's engine-adapter layer. The shell exists specifically so a third
divergence can't start.

**What must never be simplified:**
- The label/description/control/bottom-row **vertical stacking** (`flex
  flex-col`). This is what makes rule 9 ("error messages never overlap
  controls") true *structurally* — not because error text happens to be
  positioned correctly today, but because normal block flow makes an
  overlapping layout impossible to introduce by accident. Do not refactor
  this to an absolutely-positioned error tooltip/overlay, even for a
  "cleaner" look — that reintroduces exactly the class of bug this
  structure prevents.
- The `min-w-0` wrapping span around error/helper text (`<span
  className="min-w-0">{error}</span>`). Without it, a long error/helper
  message in a narrow side-by-side card forces its row wider instead of
  wrapping — this was a real, fixed defect, not defensive-by-guess code.

## ComboboxTrigger — `src/components/ui/combobox-trigger.tsx`

**Purpose.** Be the one bordered-button shell every Popover-driven
"select-like" field (search selects, async selects, multi-selects, date
pickers, relation pickers) renders through, so all of them share one visual
identity and one set of interaction states — without any of them
individually owning border/height/radius/shadow/ring/focus-ring code.

**Responsibilities:**
- The outer button shell for any Popover-driven "select-like" control:
  height, border, radius, background, shadow, focus ring, disabled state.
- The trailing chevron's idle → hover/open color transition and 180° rotation.
- `forwardRef`, so it slots under Radix's `<PopoverTrigger asChild>`.

**Explicitly not its job:** Command/CommandList filtering, what's selected,
clear buttons, loading spinners, leading icons — all composed by the caller
as `children`. The one thing the caller must track itself is the `open`
boolean: unlike Radix `Select.Trigger`, `Popover.Trigger` carries no
`data-state`, so there's nothing for the trigger to read reactively on its
own.

**Not a ComboboxTrigger consumer, by design:** `ui/select.tsx`'s own
`SelectTrigger` (Radix Select, closed static-option lists) — genuinely a
different underlying primitive, since Radix `Select.Trigger` *does* carry
`data-state`. It shares the exact same token values and chevron treatment on
purpose, it just doesn't route through this component. Rule of thumb: a
short static option list with no search → plain `<Select>`. Anything needing
search, async loading, multi-select, or a non-Select popover body (a
`Calendar`) → `ComboboxTrigger`.

**Assumptions it makes:**
- The shell itself is `w-full` and correctly follows its container (Design
  System Rule 3) — this is *not* the part that needs care from callers.
- Its own wrapper span around `children` (`flex min-w-0 flex-1 items-center
  gap-1.5 truncate`) provides `overflow:hidden`/`text-overflow:ellipsis` at
  the *row* level, which is necessary but, critically, **not sufficient** —
  see the value-text contract below.

**Value-text contract (hardened 2026-08-05):** the child that renders the
actual (potentially long) display value **must** carry its own `min-w-0
truncate` — e.g. `<span className="min-w-0 truncate">{value}</span>`. This
is not a style nicety; it is the fix for a confirmed, reproduced-live bug.
CSS `text-overflow: ellipsis` only ellipsizes an element's **own**
overflowing inline content — it does not propagate through a nested child's
box boundary. Before this fix, every consumer rendered the value as a bare
`<span>{value}</span>` with no truncation classes of its own; the wrapper's
`truncate` gave it `overflow:hidden` (so nothing broke the page layout) but
**not** an ellipsis, because the overflowing content belonged to the child,
not the wrapper. Measured live: a long selected category
("Residential — Luxury Villa with Private Pool, Garden, Staff Quarters and
Panoramic Sea View (Premium Listing)") rendered as
`"Residential — Luxury Villa with Pri"` — hard-clipped mid-word, zero
ellipsis, at 375px. All 8 current consumers now carry this fix:
`SelectField`, `SearchableSelectField`, `AsyncSelectField`,
`MultiSelectField`, `RelationField` (all 3 of its value branches),
`DateField`, `FormSelect` (single + multi), and `FormDatePicker`.

**Common mistakes:**
- Rendering the display value as a plain `<span>{value}</span>` and trusting
  the wrapper's `truncate` — this is the exact mistake the 2026-08-05 fix
  closes. If you are adding a 9th consumer, copy the pattern from
  `SelectField.tsx`'s value span, not from memory.
- Adding `flex-1` to the value span "to be safe" — unnecessary, and it can
  fight a sibling clear button's `ms-auto` for available space. The value
  span only needs freedom to *shrink* (`min-w-0`); the wrapper already
  claims the row's available width.
- Forgetting `min-w-0` specifically because the span "looks like" ordinary
  inline text — a flex item's box behaves like a block box for sizing
  purposes regardless of its own `display` value, so the same shrink rules
  that apply to a `<div>` apply to a `<span>` once it's a direct flex child.

**Anti-patterns:**
- A field-specific reimplementation of the trigger button instead of
  composing `ComboboxTrigger` — this was the exact divergence the
  2026-07-27 consolidation fixed (four independently hand-rolled Popover
  comboboxes). A new one-off trigger is a regression back to that state.
- Giving the trigger (or anything inside it) `w-fit`/`fit-content`/
  `max-content` — see Design System Rule 4. The trigger is deliberately
  `w-full`; content sizing itself instead of following the container is
  what caused the value-text bug above, one level down.

**Why the current implementation exists:** consolidates four previously
independent Popover+Command comboboxes (2026-07-27) into one shell so
border/height/radius/shadow/ring/focus-ring/chevron state can only be
defined once. The 2026-08-05 value-text contract exists because
consolidating the *shell* did not, by itself, guarantee every caller's
*content* inside that shell was safe — a shared shell only closes off the
bugs it directly controls.

**What must never be simplified:**
- The distinction between the wrapper's `truncate` (necessary, not
  sufficient) and the value-text span's own `min-w-0 truncate` (the part
  that actually renders the ellipsis). Removing the value-span-level classes
  because "the wrapper already has truncate" reintroduces the hard-clip bug
  — this exact reasoning is *why* the bug existed for as long as it did.
- The `open` boolean being caller-tracked state, not something read off a
  Radix data attribute. `Popover.Trigger` genuinely has no `data-state`
  (unlike `Select.Trigger`) — do not "simplify" this by assuming a data
  attribute will appear if you just query for it.

## GridEngine — `src/framework/form-engine/GridEngine.tsx`

**Purpose.** Render a section's fields as a 12-column responsive grid,
deciding how many fields share a row purely from the *actual rendered width*
of the container the section happens to be composed into — not from the
schema, not from the viewport.

**Responsibilities:**
- Establishes the `@container` every field's `span` (`xs`/`sm`/`md`/`lg`)
  resolves against — `col-span-N` at the base tier, `@md:col-span-N`,
  `@2xl:col-span-N`, `@4xl:col-span-N` at the others (see `utils.ts`'s
  `getGridClasses`).
- Resolves per-field visibility, permission (read/write), and
  disabled/read-only state (including the "still loading its own
  dependency's options" case) before deciding whether/how a field renders.
- Computes group-caption boundaries (`groupLabelKey`) and divider placement
  for runs of related fields within one section, from the exact same
  visible-field predicate used to decide what renders — so a caption can
  never appear over a group that's actually empty (every field in it hidden).
- Renders hidden-type fields into the DOM (invisibly) so they still register
  with the form, without giving them a grid cell.

**Assumptions it makes:**
- Every field's own rendered content already resolves to something that can
  shrink toward 0 width without an implicit floor — i.e., every leaf
  ultimately obeys Design System Rules 2–4. GridEngine does not, and
  structurally cannot, enforce this itself; it can only supply a track
  (`minmax(0,1fr)` via Tailwind's own `grid-cols-12`) that *permits* shrinking
  down to whatever the leaf allows. A field that ignores rules 2–4 will still
  render — GridEngine has no mechanism to detect or prevent that — it will
  just overflow or clip once its content is long enough, exactly like the
  `ComboboxTrigger` bug did before it was fixed one layer down.
- `field.span` values describe *container* width tiers (this grid's own
  rendered width), not viewport tiers — a `span.md` of 6 means "when this
  grid is at least `@2xl` wide," never "when the browser window is."

**Assumptions consumers (schema authors, new field types) must satisfy:**
- Pick `span` values based on how much width the field's content actually
  needs at each tier, not by copying a span that happened to work for a
  different field — a searchable select with long option labels and a plain
  checkbox do not need the same span even if they're adjacent in the schema.
- Any new field component rendered through `FieldRenderer` must itself be
  safe at `min-width: 0` — GridEngine hands it a shrinkable cell; the field
  is responsible for not silently reasserting a floor underneath that cell
  (see Field primitives, below).

**Common mistakes:**
- Introducing a new ad hoc breakpoint tier for "this one section" instead of
  reusing `xs`/`sm`/`md`/`lg` — this happened three times independently
  before `SectionRow` consolidated it (see that section) and is exactly the
  drift this system exists to prevent at the field-grid level too.
- Widening `gap-x-*` without checking the row-of-11-gaps math first: at a
  12-column grid, gap width is paid **11 times** in the track definition
  regardless of how many fields actually span across any given gap. The
  current `gap-x-2 @sm:gap-x-6` split exists specifically because a flat
  `gap-x-6` (24px × 11 = 264px of fixed gap) overflowed the narrowest real
  section card in the app (the Identity step's side-by-side cards, ~208px at
  their narrowest) before any field even got a pixel of content width.
- Assuming a field's `disabled`/`readOnly` resolution is simple boolean logic
  you can inline elsewhere — it already accounts for function-valued,
  declarative (`disabledWhen`/`readOnlyWhen`), and in-flight-dependency-fetch
  states together; reimplementing part of this elsewhere risks disagreeing
  with GridEngine about whether a field is actually interactive right now.

**Anti-patterns:**
- Bypassing `GridEngine`/`FieldRenderer` to render a field component
  directly inside a hand-built grid — this immediately loses visibility
  evaluation, permission checks, the in-flight-options disabled state, and
  group-caption placement, all silently.
- A field component that queries anything about its own grid column
  (span, container width, tier) — see Design System Rule 10. Layout
  information flows one direction only, from GridEngine down to the field
  as rendered pixels.

**Why the current implementation exists:** the `@container`-based (not
viewport-based) tier system exists because the *same* field schema renders
inside a full-width step body in some places and a narrower side-by-side
card in others (the Identity step's Classification/Governance cards) — a
viewport breakpoint cannot distinguish these two cases, only the grid's own
rendered width can.

**What must never be simplified:**
- The `gap-x-2 @sm:gap-x-6` split — collapsing it to one flat gap value
  reintroduces the exact overflow this two-tier gap was built to fix (see
  Common mistakes above), regardless of which single value is chosen.
- The group-marker computation being derived from the *same* renderable-field
  predicate the render map itself uses (`computeGroupMarkers` over
  `renderableFields`, not over the raw schema). Computing it separately
  risks a caption/divider appearing over a group that visibility rules have
  actually emptied out.

## SectionRow — `src/framework/form-engine/section-primitives.tsx`

**Purpose.** Place exactly two sections/clusters side by side once — and
only once — their shared row actually has room, at the section level (above
individual fields, below the page). Distinct from `GridEngine`: GridEngine
decides how fields lay out *within* one section; `SectionRow` decides
whether *two sections* share a row at all.

**Responsibilities:**
- Two layout variants: `'equal'` (even 2-up split) and `'sidebar'` (4:8
  split — a narrow control beside a wider content area).
- Gates the 2-up/sidebar switch on the same three container tiers
  `GridEngine` uses (`sm`→`@md`, `md`→`@2xl`, `lg`→`@4xl`), via its own
  `@container` — so a section-level "is there room" decision and a
  field-level one can never disagree about what "enough room" means at a
  given tier name.

**Assumptions it makes:**
- Exactly two children, in a fixed order (narrow-then-wide for `'sidebar'`).
  It does not reorder, wrap, or accept a variable child count.
- The caller has already picked the `tier` that matches what its *specific*
  two children actually need — `SectionRow` does not measure content itself;
  it only encodes the three canonical thresholds `GridEngine` also uses.

**Assumptions consumers must satisfy:**
- Choose `tier` from real content-width need, not preference. The three
  tiers exist because three real call sites needed three different
  thresholds (Identity's Classification|Governance, Location's Zoning|
  Proximity and Contacts|Map, Pricing's Investment|Utilities) — picking the
  wrong one re-creates the exact narrow-container squeeze this component was
  built to standardize away.
- Don't reach for `'sidebar'` for a visually-narrow-looking pair that isn't
  semantically "one control beside a wider content area" — the 4:8 split is
  a specific meaning, not just a way to make one side smaller.

**Common mistakes:**
- Inventing a fourth tier (e.g. matching some other component's `@sm`)
  instead of reusing `sm`/`md`/`lg` — this is precisely the mistake made
  three independent times before this component existed (Identity used a
  viewport `md:`, Location used `@2xl`/`@4xl`, Pricing used `@sm` — three
  different, mutually inconsistent answers to "when is there room").
- Wrapping `SectionRow` itself in another `@container` "just in case" —
  it already establishes its own; nesting containers here only makes `cqw`
  units and container-query variants deeper in the tree ambiguous about
  which ancestor they're measuring against.

**Anti-patterns:**
- A viewport-breakpoint version of this component for "just this one page"
  — see Design System Rule 1; a section's actual constraint is its own
  rendered container width, which is frequently narrower than the viewport
  once a sidebar, split view, or nested card is involved.

**Why the current implementation exists:** consolidates three independently
duplicated "two sections side by side once there's room" implementations,
one of which used a viewport breakpoint (the exact anti-pattern rule 1
warns about) and none of which agreed on a threshold with either of the
others.

**What must never be simplified:**
- `tier` being a required, explicit prop with no default. A default would
  invite every future call site to skip the "does this pair actually need
  this threshold" judgment the three original inconsistent implementations
  all skipped — which is what produced three different wrong answers in the
  first place.

## Field primitives — `src/framework/form-engine/fields/*.tsx`, `src/components/dynamic-form/Form*.tsx`

There are ~27 field types across both engines (`TextField`, `SelectField`,
`DateField`, `RichTextField`, `FileField`, `CoordinatesField`, `RelationField`,
etc.). This section is their shared contract as a family — individual field
quirks (debounce timing, date parsing, editor toolbar config) are each
field's own business and not repeated here.

**Purpose.** Own field-*type*-specific behavior and markup while composing
layers 1–2 (base primitives, `FormFieldShell`/`ComboboxTrigger`) for
everything that isn't type-specific.

**Responsibilities:**
- Wire the field's schema/config to its form-library binding (`Controller`/
  `useController` for the Wizard's RHF integration).
- Render exactly one `FormFieldShell` (or, in `dynamic-form`, the equivalent
  `DynamicFormFieldRow`-composed shell) with resolved label/error/helper
  strings — never a second, parallel label/error implementation.
- Render the actual control: either a directly-wrapped base primitive
  (`Input`, `Textarea`, `Switch`) or a `ComboboxTrigger`-based
  Popover+Command combo, per the "Shell vs. field component" table below.
- Own field-specific value shape and formatting (e.g. `CoordinatesField`'s
  `{lat, lng}` object over two native `Input`s; `RichTextField`'s HTML string
  synced from Tiptap; `FileField`'s `File | ExistingFileRef` union).

**Assumptions each field component makes:**
- It will be handed a real, bounded amount of horizontal space by whatever
  `GridEngine`/`SectionRow` composition contains it — it does not need to
  (and must not) make its own judgment about how much room it "should" have.
- Its own leaf content (a selected value, a formatted date, a file name, a
  related record's name) is not bounded in length by anything upstream —
  translations, user-entered titles, and related-record names in a real CRM
  can be arbitrarily long, and the field is the last point that can still
  apply `min-w-0`/`truncate`/wrapping before that length becomes visible
  breakage.

**Assumptions consumers (schema authors) must satisfy:**
- Don't assume a field's default width assumption matches your content —
  set `span` deliberately (see GridEngine above) rather than accepting
  whatever a neighboring field happens to use.
- Any field value that can realistically be long (a relation's display name,
  a rich-text/HTML blob, a freeform searchable-select's creatable input)
  needs to be treated as unbounded by the schema author too — e.g. don't
  disable a field's `clearable`/description affordances assuming the value
  will always be short enough that clipping "won't matter in practice."

**Common mistakes:**
- Rendering a bare `<span>{value}</span>` for a selectable/computed value
  inside a `ComboboxTrigger` without `min-w-0 truncate` — the exact,
  previously-live bug this document's 2026-08-05 extension exists to close;
  see the ComboboxTrigger section above for the full mechanism.
- Using `flex-1` where only `min-w-0` (shrink permission) was needed — see
  ComboboxTrigger's Common mistakes for why this can fight a sibling's
  `ms-auto`.
- Physical-direction utility classes (`ml-auto`, `pr-*` for "space before a
  trailing icon," `text-left`) inside a field component instead of their
  logical equivalents (`ms-auto`, `pe-*`, `text-start`) — harmless in the
  app's current LTR-only state, but silent RTL debt the moment `dir="rtl"`
  is ever wired up (see Design System Rule 6's caveat).
- A field component reading its own `overflow`/`truncate` classes as
  "cosmetic" and removing them during a refactor — for a flex item, these
  classes are load-bearing for the automatic-minimum-size calculation, not
  just visual polish (see Design System Rule 2 and the GridEngine section's
  "Assumptions it makes").

**Anti-patterns:**
- A field component re-deriving `aria-describedby`/`aria-invalid` logic
  instead of using `getFieldDescribedBy`/passing `fieldState.error` straight
  through — every field in this system computes these the same way for a
  reason (see the Accessibility contract below); a field-local variant is
  drift waiting to diverge silently.
- Hardcoding a fixed pixel width or `max-width` on a field's own root
  element "to keep it from looking too wide" — this is a `span`/GridEngine
  decision (layer 5), not something a layer-4 component should assert about
  itself (Design System Rule 10).

**Why the current implementation exists:** each field type earns its own
component specifically *because* type-specific behavior (debounced async
search, Tiptap lifecycle, dropzone handling, lat/lng parsing) doesn't belong
in a generic shell — but the amount of code that's genuinely type-specific
is deliberately kept small by pushing everything else (label row, error
row, trigger chrome, grid placement) down into layers 1–2 and up into layer
5. `TextField.tsx` (plain input) and `SearchableSelectField.tsx` (combobox)
are cited in the Extension guidelines below as reference points precisely
because they contain close to the minimum code a field of their shape
needs — a new field with substantially more boilerplate than either of
these is worth double-checking against this contract.

**What must never be simplified:**
- The `min-w-0 truncate` on every value-bearing leaf inside a
  `ComboboxTrigger`-based field (see that section's value-text contract) —
  this is the single most likely thing to be "cleaned up" by someone who
  doesn't know why it's there, since it looks redundant next to the
  wrapper's own `truncate` until you've seen the bug it prevents.
- Field-specific value normalization that looks like boilerplate but encodes
  a real data-shape decision — e.g. `RelationField`'s three-branch
  (`isMultiple` / `displayValue` / placeholder) span selection, or
  `FileField`'s `ExistingFileRef` vs. `File` distinction (an already-uploaded
  attachment vs. one freshly picked and not yet uploaded look identical to a
  user but must not be collapsed into one type, since only one of them is
  safe to re-submit as-is).

## Who must consume them

**FormFieldShell:**
- `framework/form-engine/FieldWrapper.tsx`
- `components/dynamic-form/DynamicForm.tsx` (via `DynamicFormFieldRow`)
- Any future third form engine — write a thin adapter that resolves its own
  strings, then renders `<FormFieldShell>`. Never re-implement the label/
  required/helper/error row.

**ComboboxTrigger:**
- `framework/form-engine/fields/AsyncSelectField.tsx`, `SearchableSelectField.tsx`
- `components/dynamic-form/FormSelect.tsx` (`FormSelect` + `FormMultiSelect`), `FormDatePicker.tsx`
- Any new Popover+Command-driven field added later (a relation picker, a
  color picker, etc.)

## Shell vs. field component: who owns which pixel

| Concern | Owner |
|---|---|
| Label text, required asterisk, read-only pill, tooltip | `FormFieldShell` |
| Description / helper / error copy placement + icon | `FormFieldShell` |
| Character counter | `FormFieldShell` |
| `aria-describedby` / `aria-required` / `aria-invalid` wiring on the wrapper | `FormFieldShell` |
| The control's own border/height/radius/shadow/ring (Input, Textarea, Switch, Checkbox, RadioGroup) | The shared `ui/*` primitive being wrapped — not the shell, not the field component |
| Trigger button shell + chevron, for Popover-driven fields | `ComboboxTrigger` |
| Popover body content (Command list, Calendar, selected chips) | The field component |
| Prefix/suffix decoration (currency symbol, unit suffix) | The field component (e.g. `FormInput`'s `$`/`%` spans) |
| Field-type-specific behavior (debounce, date parsing, option loading) | The field component |

Dividing line: **the shell owns everything around the control that's
identical no matter what the control is; the field component owns the
control itself and anything specific to that field type.**

## Design tokens

Fixed vocabulary shared by every layer above the base primitives. Do not
introduce a new value for any of these without updating this table first.

| Token | Value | Applies to |
|---|---|---|
| Height (default) | `h-12` | Input, ComboboxTrigger, SelectTrigger (Textarea is content-sized, `min-h-16`) |
| Height (sm) | `h-9` | `ComboboxTrigger size="sm"` — see Known gap below |
| Radius | `rounded-xl` | every control surface |
| Border (idle) | `border-border/70` | |
| Border (hover) | `border-border/90` | |
| Border (focus / combobox open) | `border-ring` | |
| Background | `bg-input` | ComboboxTrigger, Input (Textarea: `bg-transparent`) |
| Micro-shadow (idle) | `shadow-[0_1px_2px_rgba(16,24,40,0.04)]` | |
| Shadow (hover) | `shadow-[0_1px_4px_rgba(16,24,40,0.07)]` | |
| Shadow (focus / open) | `shadow-[0_1px_4px_rgba(16,24,40,0.06)]` | |
| Focus ring | `ring-3 ring-ring/15` | focus-visible, and ComboboxTrigger's `open` state |
| Error ring / border | `ring-3 ring-destructive/20` / `border-destructive` | `aria-invalid` |
| Placeholder | `text-muted-foreground/50` | every control, including ComboboxTrigger's placeholder text |
| Transition (surface) | `transition-all duration-200` | |
| Transition (chevron) | `transition-[rotate,color] duration-200 ease-out` | **Must** list `rotate`, not `transform` — Tailwind v4 rotates via the native `rotate` CSS property. `transition-[transform,...]` silently disables the rotation animation with no error; this exact mistake was made and caught twice in this consolidation. |
| Label | `text-[13px] font-semibold tracking-tight` | `FormFieldShell` |
| Helper / error text | `text-xs`, prefixed with `Info` / `AlertCircle` | `FormFieldShell` |

**Known gap (not fixed in this pass):** `ui/select.tsx`'s own `sm` size is
`h-7`; `ComboboxTrigger`'s `sm` is `h-9`. No screen currently places both
size variants side by side, so this hasn't produced a visible inconsistency
— but if that changes, reconcile the two rather than adding a third value.

## Accessibility contract

- Every control gets a real DOM `id`; `FormFieldShell`'s label uses
  `htmlFor={id}`. The Wizard derives it via `getFieldId(schema.key)`;
  Pipeline derives it via `useFormField()`'s `formItemId` (Radix `Slot`-
  injected onto the control through `FormControl`). Different mechanisms,
  same contract: the id passed to the shell must be the id actually rendered
  on the interactive control, not a wrapper div.
- `aria-describedby` points at the helper *or* error paragraph's id (never
  both — error takes priority) and is computed by the shell, not by callers.
- `aria-invalid` is set on the shell's wrapper div, and separately on the
  real control by the field component (`aria-invalid={!!fieldState.error}`)
  — the field component owns this since the shell has no reference to the
  actual control element.
- Error text has `role="alert"`; the counter row has `aria-live="polite"`.
- `ComboboxTrigger` renders a real `<button type="button">`, not a styled
  div, so it's keyboard/AT-operable with no extra work. Its `aria-invalid`
  prop is intentionally a styling hook (`aria-invalid:border-destructive`),
  matching the existing `SelectTrigger` convention elsewhere in the app —
  not a claim that `button` is itself a validatable form role.
- Tooltip trigger buttons are `tabIndex={-1}` (reachable via the label's
  flow, not a separate tab stop) and carry an explicit `aria-label`.

## Extension guidelines for future field types

1. **Never write a new label/required/helper/error block.** Render
   `<FormFieldShell>` and pass it already-resolved strings.
2. **Never write a new bordered `<button>` trigger for a Popover/Command
   combo.** Render `<ComboboxTrigger>` and put field-specific content in its
   children.
3. **Plain text-like input?** Wrap the shared `ui/input.tsx` /
   `ui/textarea.tsx` directly — no independent border/height/shadow/ring
   classes. For prefix/suffix decoration, follow `FormInput.tsx`'s or
   `TextField.tsx`'s absolute-positioned span pattern and pad the input
   (`pl-8` / `pr-8`) to match.
4. **Toggle-like control (switch/checkbox/radio)?** Wrap the shared
   `ui/switch.tsx` / `ui/checkbox.tsx` / `ui/radio-group.tsx` directly, same
   rule — no independent border/ring overrides.
5. **Building a field for a third form engine?** Don't copy either existing
   engine's field component. Write a thin adapter that resolves that
   engine's own config/schema into plain props, then delegates to the same
   `FormFieldShell` / `ComboboxTrigger` / `ui/*` primitives everyone else
   uses.
6. **Before adding any new className for border/radius/shadow/ring/height,**
   check the Design tokens table first. A new value here is very likely
   drift, not a genuinely new requirement.
7. **When in doubt, diff against a known-good reference:**
   `framework/form-engine/fields/TextField.tsx` (plain input) and
   `SearchableSelectField.tsx` (combobox) are the thinnest, cleanest current
   examples of "how much should this wrapper actually do."

## Future field types — named integration guidance

Several of the field shapes a future request is likely to name already exist
in some form. Where that's true, the guidance below points at the real
implementation as precedent instead of speculating about a hypothetical one
— check whether you're extending something that already exists before
building a "new" field type.

**Rich text.** Already exists —
`framework/form-engine/fields/RichTextField.tsx` (Tiptap-based) and
`components/dynamic-form/FormRichText.tsx`. Note its shell is deliberately
**not** `ComboboxTrigger` or a wrapped `ui/textarea.tsx` — a rich-text editor
is its own bordered container (`RichTextEditor`'s own
`overflow-hidden rounded-xl border border-border/70 bg-background` +
`focus-within:` ring), because its content area, toolbar, and status bar are
three stacked regions, not one control. It still matches every other
control's token language (border/radius/shadow/ring values — see its own
comment: "matches Input/Select/Textarea/Combobox's strengthened hover
signal") without literally reusing their markup. **Precedent for any future
field whose natural shape isn't a single input/button:** match the shared
token *values*, not the shared component *markup*, when the control
genuinely has multiple internal regions.

**Upload / file attachment.** Already exists —
`framework/form-engine/fields/FileField.tsx` (dropzone + file list, single or
multiple, `File | ExistingFileRef` union — see that type's own comment for
why an already-uploaded attachment and a freshly-picked file must stay
distinct types rather than being collapsed into one). A future Upload
variant (e.g. an image-specific one with previews) should extend this
pattern, not replace it — `ImageField.tsx`/`MultiImageField.tsx` already do
exactly this for the image case. **Watch specifically:** the file-name
`<span className="flex-1 truncate">` in the selected-file row uses `flex-1`
without an explicit `min-w-0`. `flex-1` sets `flex-basis: 0%`, which is a
different mechanism from the automatic *minimum*-size clamp — a flex item's
`min-width: auto` floor is not overridden by `flex-basis` alone. This has
not been reproduced as a live bug (unlike the `ComboboxTrigger` case, which
was), but it is the same shape of risk and is worth a real long-filename
test before treating it as settled either way.

**Address / coordinates.** Already exists —
`framework/form-engine/fields/AddressField.tsx` (structured address parts)
and `CoordinatesField.tsx` (paired lat/lng `Input`s in a plain
`grid-cols-2`, both native, both already `w-full` via the shared `Input`
primitive — no overflow risk, since neither renders unbounded text). A
future **MapPicker** (an actual interactive map for point selection, not
just numeric lat/lng entry) is the part that's genuinely new here. Integration
guidance:
- Compose it as one more field type through `FieldRegistry`/`FieldWrapper`,
  same as every other field — a map is not exempt from rendering through
  `FormFieldShell` for its label/error/helper row.
- The map canvas itself is the one place in this system where *intrinsic,
  content-driven* sizing (Design System Rule 2) doesn't apply in the usual
  sense — a map needs a real, non-content-derived height. Use `aspect-ratio`
  (still container-*width*-driven, per Rule 1 — the height derives from
  whatever width the grid cell provides) rather than a fixed pixel height,
  so it still degrades correctly from 320px to 2560px instead of clipping or
  leaving dead space. Do not give it a fixed `width` — only ever a fixed or
  `aspect-ratio`-derived *height*.
- Any address/place text the map surfaces (a reverse-geocoded label, a
  selected place name) is exactly the kind of value Design System Rule 9
  covers — route it through the same `min-w-0 truncate` discipline as every
  other value-bearing leaf, not a bespoke overlay label with its own sizing.

**AI-assisted field ("AIField").** No existing precedent in this codebase —
genuinely new. Integration guidance, extrapolated from the rest of this
contract rather than from any existing file:
- Still one `FieldRegistry` entry, still one `FormFieldShell` wrap. An AI
  suggestion/response is a *value this field can produce or consume*, not a
  reason to skip the shell's label/error/helper contract.
- AI-generated text is realistically unbounded and un-previewable in length
  at authoring time — treat every rendered surface of it (an inline
  suggestion chip, a preview snippet) as needing explicit truncation/wrapping
  decisions, the same as a translated string or a user-entered title. Do not
  assume "the model tends to return short answers" as a substitute for
  actually constraining the layout — that assumption is exactly how the
  `ComboboxTrigger` bug went unnoticed for as long as it did (real selected
  values are usually short too; the bug only showed up once one wasn't).
- A loading/"generating" state is not exempt from Design System Rule 8
  (accessibility) — it needs the same `aria-live="polite"` treatment this
  system already uses for autosave/loading states elsewhere (see
  `ComboboxTrigger` consumers' `Loader2` + `aria-live` patterns), not a
  bespoke spinner with no announcement.
- If it opens a Popover/Command surface (e.g. "pick one of these AI
  suggestions"), it is a `ComboboxTrigger` consumer like any other — see
  that section's full contract, including the value-text truncation rule,
  before writing new trigger markup.

**General rule for anything not listed above:** before building a new field
type, check `FieldRegistry.ts`'s existing ~27 registrations first. The
question is rarely "does this new shape need a new pattern" — so far, every
field type this app has needed has fit into "wrap a base primitive" or
"compose `ComboboxTrigger`," per the Shell vs. field component table above.
Needing a genuinely third shape should be treated as a rare event worth
updating this document for, not a default assumption for the next field.
