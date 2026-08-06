# ADR 0001: Typography Semantic Roles

**Status:** Proposed — not yet implemented. No component, className, or token in the
codebase changes as a result of this document. It defines vocabulary only.

**Context owner:** Design System audit, 2026-07-25 (font-black usage review →
semantic classification → this ADR).

## Context

A design system audit found 48 uses of `font-black` (900) across 19 files, plus 2
`font-extrabold` (800) uses and one raw inline `fontWeight: 800`. The audit
established two things that motivate this ADR before any numeric token work:

1. **The numeric weight itself carries no signal.** This app's Poppins loading
   config (`layout.tsx`) only fetches static weights 300–700. A rendering check
   (side-by-side screenshot + computed `font-family`/`font-weight`) confirmed 700,
   800, and 900 are visually identical today — every `font-black`/`font-extrabold`
   call site is, in practice, rendering Bold. So "should this be 900 or 800" was
   never an answerable question; the actual open question was always semantic:
   *what role is this text playing, and does that role already exist somewhere
   else under a different name or a slightly different shape?*

2. **The same semantic intent is independently re-implemented, inconsistently,
   across files** — sometimes down to a component's own doc comment describing a
   distinction that no longer exists in the code (see `InfoRow` vs.
   `DefinitionList` under Definition Value, below), and once via a comment that
   explicitly reaches for a shared role across three incompatible scales without
   ever naming it (`PropertyMapLibreInner.tsx`, under Primary Metric, below).

This ADR names each role in terms of **intent** — purpose, typical content,
hierarchy position, and where it may or may not appear — deliberately excluding
font size, weight, tracking, and color. Those are implementation details of a
role, decided only after the roles themselves are agreed. A future ADR (or a
direct token PR) assigns the numeric values; this one is the vocabulary those
values will attach to.

## Decision

Define ten semantic typography roles. Each is described independent of any
Tailwind class or design token. "Existing canonical implementation" cites the
file(s) that already express the role's intent most faithfully — not
necessarily the most common instance, but the one worth converging on if this
role becomes a real token. "Existing outliers" lists call sites that are
reaching for the role's intent but diverge from that implementation in a way
that would need reconciling.

---

### Display

**Purpose.** Announce *what this entire page is about*, at the scale of a
masthead — the one moment per page where typography itself is allowed to be the
dominant visual element, not just a label on top of other content.

**Typical content.** A record's own name/title, when that record is the entire
reason the page exists (a property's listing title over its hero photo). Never
a number, a status, or a count.

**Visual hierarchy.** The single largest, heaviest text on the page. Exactly one
per page. Nothing else on that page may compete with it in size or weight.

**Where it is allowed to appear.** Directly over or immediately beside a page's
primary hero visual, at the top of a record's dedicated detail view.

**Where it should not be used.** List/grid item titles (a card's own title is
Primary Metric or a plain heading, not Display — a page can have many cards but
exactly one Display). Modal/dialog titles. Any page without a hero visual to
anchor it.

**Existing canonical implementation.** `PropertyIntelligenceHeroSection.tsx:283`
— the property title rendered over the hero image.

**Existing outliers.** None found — this is the one role in the audit with a
single, uncontested implementation.

---

### Page Title

**Purpose.** Orient the user to *which page/flow they're in*, for pages that
have no hero visual of their own — the everyday "you are here" heading for
ordinary CRUD and utility pages.

**Typical content.** A page or flow's own name ("Calendar," "Documents,"
"Identity & Governance"), optionally with a short subtitle underneath.

**Visual hierarchy.** Below Display in weight/size (it has no hero to anchor
against), but still the clear top of its own page's hierarchy — nothing else on
a plain dashboard page should out-rank it.

**Where it is allowed to appear.** The top of any standard dashboard page
(list pages, settings pages) and the top of each step in a multi-step flow.

**Where it should not be used.** Any page that already has a Display-role
title (don't stack two competing "biggest text on the page" claims). Section
groupings *within* a page — that's Section Header, not Page Title.

**Existing canonical implementation.** `components/dashboard/PageHeader.tsx:38`
— the shared component behind Calendar, Chat, Company, Documents, Email, FSPO,
and Notifications.

**Existing outliers.** `components/form-framework/FormPageHeader.tsx:90` is a
second, independent implementation for the Property Wizard's own page/step
title — arguably justified (a multi-step flow's title plausibly needs more
visual weight than a static list page's), but that justification has never been
written down, and no one has confirmed these are meant to be two different
tiers rather than one drifted twice.

---

### Hero Value

**Purpose.** Present the *one figure a page exists to show* — the number a user
opens this specific page to find, before reading anything else.

**Typical content.** A record's headline financial figure (an asking price on
its own detail page). Always a single value, never a list of values.

**Visual hierarchy.** Large enough to be found at a glance without reading
labels first — second only to Display in scale on pages that have both, and the
top of the hierarchy on pages that don't.

**Where it is allowed to appear.** Exactly once per record-detail page, in the
section that page treats as its financial/primary-fact centerpiece.

**Where it should not be used.** Anywhere a value repeats across multiple items
on the same page (a list of properties, each with a price) — that's Primary
Metric, not Hero Value, because "hero" implies singular, unrepeated emphasis.

**Existing canonical implementation.**
`FinancialIntelligenceOS.tsx:170` — the Property Details page's asking price.

**Existing outliers.** None found in current usage — this role currently has
exactly one call site, which is the correct shape for it.

---

### Primary Metric

**Purpose.** Show *the figure this repeated unit is defined by*, when that same
kind of figure recurs across many instances of similar content (many property
cards, each with a price; a map popup, each representing one property).

**Typical content.** The same conceptual value as Hero Value (often literally
price), but appearing once per repeated unit rather than once per page.

**Visual hierarchy.** Prominent within its own card/unit — usually the largest
text inside that unit — but never competing with a page-level Display or Hero
Value that might appear elsewhere on the same screen.

**Where it is allowed to appear.** Card/row summaries in a list or grid, compact
popups/tooltips representing one record, anywhere the "one figure per repeated
item" pattern holds.

**Where it should not be used.** The one-time, page-level figure a Hero Value
already covers — don't reach for Primary Metric just because a value is
important; reach for it because the value *repeats*.

**Existing canonical implementation.** Undecided by this audit — see outliers.
This is the role most in need of a single implementation, not a role that
already has one worth pointing to.

**Existing outliers.** Three independent implementations of what is provably
the same role and the same underlying field (price):
`PropertyCard.tsx:213` (grid view), `PropertyCard.tsx:467` (list view, same
component, same data — different from its own sibling above), and
`PropertyMapLibreInner.tsx:230`, whose own comment states it's trying to match
"the same role Command Hub's agent name and Financial's KPI values play
elsewhere" — i.e., the author already sensed this role should be unified and
had no name to unify it under. Resolving Primary Metric is the single highest-
value outcome of formalizing this hierarchy.

---

### Secondary Value

**Purpose.** Show a figure that matters but is explicitly *not* the main reason
this unit exists — supporting context sitting beside or under a more important
value or label.

**Typical content.** A status figure, an assigned person's name, a running
count, an event's associated value in a timeline entry — informational, but
subordinate.

**Visual hierarchy.** Noticeably below Primary Metric/Hero Value in visual
weight, but still above plain body text — it needs to read as "a value," just
not the headline one.

**Where it is allowed to appear.** Dashboard/command-hub style summary panels,
timeline entries, anywhere a fact is presented next to (not instead of) a more
prominent one.

**Where it should not be used.** As a stand-in for Definition Value — if the
content is one of several parallel label/value pairs in a fact grid, it's
Definition Value, not Secondary Value, regardless of how important the fact is.

**Existing canonical implementation.** `OperationsCommandHub.tsx:172,177` (agent
initial + name) — cited by name in another file's comment as the reference
convention for this role, making it the closest thing to an agreed canonical
instance already in the codebase.

**Existing outliers.** `OperationsCommandHub.tsx:75,100,231,314,329` — five more
instances in the same file, each a slightly different size, suggesting the role
itself is right but has never been pinned to one shape even locally.
`PropertyTimeline.tsx:181` implements the same role independently, with its own
label-pairing convention that doesn't match Command Hub's.

---

### Definition Value

**Purpose.** Present *one fact among several parallel facts* — the value half
of a label/value pair inside a fact grid or spec list, where many such pairs
appear together with equal standing.

**Typical content.** Any discrete attribute value shown next to its own label —
a construction material, a slope grade, a square-meter figure, a full
specification row.

**Visual hierarchy.** Anchors its own label (the label should read distinctly
quieter than the value it belongs to), but individual Definition Values don't
compete with each other for attention — a fact grid's power is that every
row reads at the same, calm weight.

**Where it is allowed to appear.** Any fact grid, specification list, or
definition-list-shaped layout, wherever the content is "N parallel label/value
pairs," regardless of which page or entity it belongs to.

**Where it should not be used.** A page's one standout figure (Hero Value) or a
repeated unit's own headline figure (Primary Metric) — Definition Value is for
the *supporting* facts around those, not for the fact currently carrying the
page.

**Existing canonical implementation.** This role has **three parallel
from-scratch implementations of the identical pattern**:
`components/shared/DefinitionList.tsx:23`, `components/shared/InfoRow.tsx:28`,
and `LandDetailsCard.tsx:48`. `InfoRow.tsx`'s own header comment claims
`DefinitionList` differs from it (a dimmed label color, "a real, verified pixel
difference, not merged away") — that claim is no longer true; the two
components render identically today. This is the clearest single case in the
whole audit of a role needing one name and one home.

**Existing outliers.** `ConstructionSystemsCard.tsx:159-160,180-181` (one
internally consistent pair) and `ConstructionSystemsCard.tsx:222-223` (a third,
slightly different instance in the *same file*) — three near-matches instead of
one shared shape, even locally.

---

### Status Badge

**Purpose.** Communicate a discrete state as a small, self-contained, visually
bounded chip — something a user scans for, not reads as prose.

**Typical content.** A lifecycle status, a category/type tag, a request type —
short, enumerable values with a small fixed vocabulary.

**Visual hierarchy.** Deliberately compact and self-contained (bordered/filled
shape, not free-floating text) — it should never be mistaken for a heading or a
value in a fact grid, because its container, not its text alone, carries the
meaning.

**Where it is allowed to appear.** Directly beside a record's title/identity
(status/type pills on the Display hero), and as small count indicators next to
a Section Header (e.g., "N events," "N documents").

**Where it should not be used.** As a replacement for Eyebrow Label — a badge
always implies a bounded shape (chip, pill, bordered box) around the text; an
Eyebrow Label never has one. If there's no visible container, it isn't a Status
Badge.

**Existing canonical implementation.**
`PropertyIntelligenceHeroSection.tsx:264,271,276` — the three hero pills
(status, type, request type), consistent with each other in every current
implementation detail.

**Existing outliers.** The count-badge variant of this role has two
incompatible shapes doing the same job: `PropertyTimeline.tsx:99` (a full pill)
and `LegalTab.tsx:254` (a bordered box) both show "N items next to a section
title," and disagree on container shape. Two more, `PropertyTimeline.tsx:152`
and `LegalTab.tsx:175`, are typed chips (event type, document type) that
likewise don't yet agree with each other.

---

### Eyebrow Label

**Purpose.** Quietly name *what category of information follows*, immediately
above or beside it — present for orientation, not for emphasis. The reader
should absorb it without their eye stopping on it.

**Typical content.** A short category name ("Office Notes," "AI Evaluator,"
"Listing Agent," "Locating property…") sitting in front of the value or content
block it introduces.

**Visual hierarchy.** The quietest text role in this hierarchy that still
counts as a label rather than body copy — it must always read as visually
subordinate to whatever value, block, or section it's introducing.

**Where it is allowed to appear.** Immediately before or beside any value,
block, or panel that needs a quiet category marker — dashboard/command-hub
sub-panels, loading-state captions, small metadata callouts.

**Where it should not be used.** As a page or section's actual heading — an
Eyebrow Label introduces content, it does not stand in for a Section Header,
even when it's the most prominent text currently visible in a small panel.
(This is the exact confusion found in the audit — see outliers.)

**Existing canonical implementation.**
`OperationsCommandHub.tsx:72,214,222,230,294` — five instances in one file,
mutually consistent, the strongest existing convention of any role in this
audit.

**Existing outliers.** `OperationsCommandHub.tsx:290-294` defines this exact
role inside a **locally-scoped function it names `SectionHeader`** — colliding
with `components/shared/SectionHeader.tsx`'s real Section Header role in name
only, not in substance. `LocationIntelligenceCenter.tsx:455` and
`PhotosTab.tsx:199` implement the same intent with their own independent
sizing/tracking choices. `NeighborhoodPanel.tsx:186` implements a distance
caption with the role's intent but without the tracking treatment every other
instance carries.

---

### Interactive Label

**Purpose.** Mark text that is *itself the clickable control* — a compact,
uppercase-style action rendered as text rather than as a button, where the
text's weight signals "this responds to a click" the way a button's border
normally would.

**Typical content.** Short action phrases — "View on map," "Copy," "View
contact" — never body copy, never a value.

**Visual hierarchy.** Comparable in size/weight to an Eyebrow Label, but
distinguished by carrying interaction affordance (hover/focus states) — the
weight here is doing double duty as both "small label" and "this is a
control."

**Where it is allowed to appear.** Inline actions attached to a specific piece
of content (a coordinate pair, a contact reference) where a full button would
be visually heavier than the moment warrants.

**Where it should not be used.** Primary or secondary page actions — those
belong to the actual Button component and its variants, not to text styled to
look interactive. Interactive Label is for small, inline, contextual actions
only.

**Existing canonical implementation.**
`AddressCoordinatesPanel.tsx:95,103` and `ContactsCard.tsx:61` — three
instances, mutually consistent, across two files.

**Existing outliers.** None found — this is the second role (with Status
Badge's hero-pill cluster and Eyebrow Label's Command Hub cluster) that is
already internally consistent and ready to formalize close to as-is.

---

### Section Header

**Purpose.** Name a distinct content section *within* a page, so a user can
tell where one grouping of information ends and the next begins.

**Typical content.** A section's own name ("Timeline," "Legal Documents,"
"Financial Intelligence") — never a value, never a category tag.

**Visual hierarchy.** Below Page Title (a page can contain many Section
Headers, but only one Page Title), and unambiguously above every role that
appears *within* the section it introduces, including Eyebrow Label — a Section
Header must always outrank the eyebrows nested beneath it.

**Where it is allowed to appear.** The top of any distinct content block within
a page — a card, a panel, a grouped region of a detail view.

**Where it should not be used.** As a quiet, uppercase micro-caption — if the
text is meant to be absorbed quietly rather than read as a heading, it's an
Eyebrow Label, not a Section Header, regardless of what the surrounding code
currently calls it.

**Existing canonical implementation.** `components/shared/SectionHeader.tsx:16`
— the shared, reusable component.

**Existing outliers.** `PropertySpecsBar.tsx:211` re-implements this role's
exact intent by hand (identical classes to the shared component) instead of
composing `SectionHeader.tsx` itself. `LegalTab.tsx:251` implements a third,
smaller variant of the same intent. Most notably,
`OperationsCommandHub.tsx:290-294` defines a **same-named, different-role**
function — see Eyebrow Label's outliers above for the other half of this
collision.

---

## Consequences

- No token, class, or component changes from this document. Every "existing
  canonical implementation" and "existing outlier" cited above remains
  untouched until a follow-up decision assigns numeric values and a rollout
  plan.
- Once these ten roles are agreed, the outliers listed under each one become
  the migration backlog — each outlier is a call site that should eventually
  resolve to its role's canonical shape, not to a new one-off.
- The `OperationsCommandHub.tsx` naming collision (a function called
  `SectionHeader` that is actually an Eyebrow Label) should be renamed as part
  of that future work, independent of any visual change, since it currently
  makes the codebase self-contradictory about what a "Section Header" is.
- `Primary Metric` and `Definition Value` are flagged as the two
  highest-value consolidation targets: Primary Metric because three
  independent implementations of the same field (price) exist with no
  canonical instance yet chosen, and Definition Value because two shared
  components (`DefinitionList`, `InfoRow`) now duplicate each other entirely,
  contradicting their own documented reason for staying separate.
- Numeric typography tokens (`text-display`, `text-hero-value`,
  `text-primary-metric`, etc., per the prior audit's naming proposal) are the
  natural next step once this ADR is approved, but are explicitly out of scope
  here.
