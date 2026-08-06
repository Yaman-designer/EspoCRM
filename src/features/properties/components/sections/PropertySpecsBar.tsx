'use client'

import { useState } from 'react'
import { Bed, Bath, Square, Calendar, ShieldCheck, Layers, Gauge, ListTree, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InfoRow } from '@/components/shared'
import type { SpecKey, SpecsViewModel } from '../../view-models/specs.viewmodel'

// Property Details Completion (2026-07-17). "Full Specifications" opens a
// self-contained dialog rather than plumbing new callback state through
// PropertyDetailView. onViewFullSpecs is kept as an optional override for a
// future caller that wants its own handling instead of the built-in dialog.
//
// Quick Specifications UX Architecture pass (2026-07-20). The strip is a
// CSS grid with `repeat(auto-fit, minmax(...))` columns — a fluid
// algorithm, not fixed breakpoint-specific column counts, so it naturally
// produces every tier the brief asks for as an emergent property of the
// same one rule: as many columns as actually fit at the current width,
// never fewer than 1, every spec always rendered as its own full,
// unclipped card.
//
// Enterprise architecture pass (2026-07-23). Field selection, the combined
// "Floor X of Y" display rule, and the Full Specifications modal's 4-group
// taxonomy used to live inline in this component; all of it now arrives
// pre-shaped via `SpecsViewModel` (see view-models/specs.viewmodel.ts).
// Icon *resolution* stays here — a UI-library binding, not a ViewModel concern.

const SPEC_ICON: Record<SpecKey, LucideIcon> = {
  bedrooms: Bed, bathrooms: Bath, area: Square, floor: Layers,
  yearBuilt: Calendar, energyClass: ShieldCheck, condition: Gauge,
}

interface PropertySpecsBarProps {
  viewModel: SpecsViewModel
  onViewFullSpecs?: () => void
}

export function PropertySpecsBar({ viewModel, onViewFullSpecs }: PropertySpecsBarProps) {
  const { t } = useTranslation('properties')
  const [fullSpecsOpen, setFullSpecsOpen] = useState(false)
  const { items, fullSpecGroups, isEmpty } = viewModel

  if (isEmpty) return null

  return (
    <section className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-4.5 flex flex-col gap-4">

      {/* Each spec is a self-contained bordered card, not a border-divided
          inline segment — that only reads correctly in a single row, and
          this grid can wrap to multiple.
          Information hierarchy pass (2026-07-25). Was flat: value and label
          both `font-black`, a bare `bg-background/40` tile with no shadow —
          a value and its label read at equal weight, and the tile itself
          barely separated from the section's own `bg-card` surface. Value
          is the sole anchor (kept font-black + tracking-tight); label uses
          the exact quiet-caption treatment already established elsewhere in
          this app (ScoreCard in ReviewStep.tsx, PropertyToolbar's
          DrawerSection/PopoverHeader) — `font-semibold uppercase
          tracking-widest text-muted-foreground/50` — reused verbatim, not
          reinvented. `bg-muted/25` (a real surface token) replaces the prior
          `bg-background/40` (the page background bleeding through a card)
          for actual tonal separation from the section's white surface, plus
          `shadow-design-xs` for a hint of lift — the same token the icon
          swatch below already picks up.

          Density refinement pass (2026-07-25, same day). The hierarchy pass
          above intentionally added weight/size to fix a flatness problem;
          this pass dials the resulting footprint back down ~10-15% (card
          padding 4.5/3.5→4/3, icon swatch 11→10, icon glyph 5.5→5, value
          16px→14px, label 10px→9px, inter-card gap 3→2.5, section shell
          padding/gap 5→4.5/4) now that the surface/border/shadow treatment
          from that same pass already does the separation work — none of
          those tokens change here, only scale. Every color, border, shadow
          and radius is untouched; this is a size/spacing pass only. */}
      <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        {items.map(item => {
          const Icon = SPEC_ICON[item.key]
          return (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3 min-w-0 shadow-design-xs"
            >
              <div className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl shadow-design-xs',
                item.emphasize
                  ? 'bg-brand-emerald/8 border border-brand-emerald/20'
                  : 'bg-background border border-border/70',
              )}>
                <Icon className={cn('size-5', item.emphasize ? 'text-brand-emerald' : 'text-muted-foreground')} />
              </div>

              <div className="min-w-0">
                <div className={cn(
                  'text-sm font-black leading-none tracking-tight mb-1',
                  item.emphasize ? 'text-brand-emerald' : 'text-foreground',
                )}>
                  {item.value}
                </div>
                <div className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                  {t(item.subKey)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Premium redesign pass (2026-07-26). This IS the section's one CTA
          and, per explicit product direction, needs to read as worth
          clicking on sight — refinement and craftsmanship over color, not
          the quiet plain-card treatment the 2026-07-25 density-refinement
          pass deliberately chose. Reverses that pass, doesn't regress it:
          swapped `outline`/`sm` for the new `ink` variant (button.tsx) at
          `size="default"` (h-12/48px, px-[22px], text-sm) — a monochrome
          bg-foreground/text-background fill, no border, shadow-design-sm
          resting elevation escalating on hover, -translate-y-px lift,
          active press back to shadow-design-xs, icon translate-x-0.5 on
          hover. Deliberately not `default`/`surface` (both carry the app's
          primary blue) — this section has no other primary CTA to compete
          with, but reusing primary's own hue here would misrepresent this
          as "the app's main action" rather than this section's. Full-width
          on mobile unchanged — still a full-width row, thumb reach is
          horizontal not vertical regardless of button height. */}
      <div className="flex justify-center border-t border-border/40 pt-4 sm:justify-end">
        <Button
          type="button"
          variant="ink"
          onClick={onViewFullSpecs ?? (() => setFullSpecsOpen(true))}
          className="w-full sm:w-auto"
        >
          <ListTree aria-hidden="true" />
          {t('specs.fullSpecifications')}
        </Button>
      </div>

      <FullSpecsDialog open={fullSpecsOpen} onOpenChange={setFullSpecsOpen} groups={fullSpecGroups} />

    </section>
  )
}

// ── Full Specifications dialog ──────────────────────────────────────────────
// Property Details Completion (2026-07-17). The Size, Rooms & Structure
// Wizard step's fields with no other home in the Details page — the bar
// above is deliberately a curated top-line strip, not a full listing.
//
// Quick Specifications UX Architecture pass (2026-07-20). Real groups
// (Dimensions, Rooms, Building & Construction, Parking — named for what
// data actually exists among these fields, not a fixed taxonomy padded
// with empty categories), each rendered only when it has ≥1 populated
// field. The dialog itself scrolls internally past 85vh so a property with
// every field populated never gets clipped on a short viewport.
//
// Mobile UX pass (2026-07-24). Two changes, no fields added/removed/reworded:
//
// 1. Fixed a real width bug, not a redesign choice: `max-w-3xl` (bare, no
//    breakpoint) was passed alongside shadcn Dialog's own base classes
//    (`max-w-[calc(100%-2rem)] ... sm:max-w-sm`). Tailwind-merge treats any
//    unprefixed `max-w-*` as one conflict group, so `max-w-3xl` silently
//    deleted the mobile side-margin class entirely (dialog rendered edge-to-
//    edge on phones — confirmed via direct tailwind-merge output, not
//    inferred) while `sm:max-w-sm` — untouched, since it's a different
//    prefixed conflict group — kept capping the dialog at 384px on every
//    desktop width, so `lg:grid-cols-3` below was cramming 3 columns into a
//    ~336px-wide box that could never actually hold them. `sm:max-w-2xl`
//    replaces `max-w-3xl`: same breakpoint-prefix group as the base
//    component's own `sm:max-w-sm`, so it cleanly overrides it instead of
//    deleting an unrelated class, restoring the mobile margin and giving
//    desktop the width the 3-column grid actually needs.
// 2. Each group is now its own bordered card (was: a heading + an
//    underline, no card boundary) so "4 sections" reads as 4 distinct
//    blocks at a glance instead of one continuous list — real visual
//    grouping, not a cosmetic tint. Within a card, fields sit in a
//    width-responsive `auto-fit` grid (DefinitionList's own established
//    pattern elsewhere on this page, reused rather than reinvented) instead
//    of a `sm:/lg:` viewport-breakpoint grid, so a typical 375–430px phone
//    already gets 2 columns of fields — the "one value per row" density
//    complaint was real at those widths under the old breakpoint grid,
//    which only broke to 2 columns at ≥640px viewport width. Cards
//    themselves go 2-up at ≥640px (same breakpoint the width fix makes the
//    dialog actually wide enough for), 1-up below it — group-level layout
//    stays viewport-based since two ~300px-wide group cards genuinely don't
//    fit side by side on a 375px phone, unlike the fields inside one.

function FullSpecsDialog({
  open, onOpenChange, groups,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: SpecsViewModel['fullSpecGroups']
}) {
  const { t } = useTranslation('properties')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="text-xl font-black text-foreground tracking-tight font-heading">
          {t('specs.fullSpecifications')}
        </DialogTitle>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 py-4">{t('specs.noSpecsRecorded')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {groups.map(group => (
              <div key={group.headingKey} className="rounded-xl border border-border/50 bg-background/40 p-4">
                <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
                  {t(group.headingKey)}
                </h4>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-4 gap-y-3">
                  {group.rows.map(row => <InfoRow key={row.labelKey} {...row} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
