'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import { MediaLightbox } from '@/components/shared'
import { useFavoriteState } from '../hooks/useFavoriteState'
import { buildPropertyNarrative } from '../lib/property-narrative'
import { PAGE_PADDING_X } from '../lib/page-layout'
import { buildEntitySlug } from '@/shared/detail-view'
import { buildPropertyDetailPageViewModel } from '../view-models/detail-page.viewmodel'
import { buildFinancialViewModel } from '../view-models/financial.viewmodel'
import { buildTimelineViewModel } from '../view-models/timeline.viewmodel'
import { buildOperationsViewModel } from '../view-models/operations.viewmodel'
import { buildAssetsViewModel } from '../view-models/assets.viewmodel'
import { buildAddressCoordinatesViewModel } from '../view-models/location.viewmodel'
import { buildHeroViewModel } from '../view-models/hero.viewmodel'
import { buildBriefingViewModel } from '../view-models/briefing.viewmodel'
import { buildDescriptionViewModel } from '../view-models/description.viewmodel'
import { buildSpecsViewModel } from '../view-models/specs.viewmodel'
import { buildConstructionViewModel } from '../view-models/construction.viewmodel'
import { buildFeaturesViewModel } from '../view-models/features.viewmodel'
import { buildLandViewModel } from '../view-models/land.viewmodel'
import { buildContactsViewModel } from '../view-models/contacts.viewmodel'
import type { RealEstateProperty } from '../types/property.types'

import { ExecutiveBriefingCard }         from './sections/ExecutiveBriefingCard'
import { ListingDescriptionCard }        from './sections/ListingDescriptionCard'
import { PropertyIntelligenceHeroSection } from './sections/PropertyIntelligenceHeroSection'
import { PropertySpecsBar }              from './sections/PropertySpecsBar'
import { FinancialIntelligenceOS }       from './sections/FinancialIntelligenceOS'
import { PropertyTimeline }              from './sections/PropertyTimeline'
import { AssetManagementSystem }         from './sections/AssetManagementSystem'
import { LocationIntelligenceCenter } from './sections/LocationIntelligenceCenter'
import { AddressCoordinatesPanel } from './sections/AddressCoordinatesPanel'
import { OperationsCommandHub }          from './sections/OperationsCommandHub'
import { RelatedPropertiesSection }      from './sections/RelatedPropertiesSection'
import { ContactsCard }                  from './sections/ContactsCard'
import { LandDetailsCard }               from './sections/LandDetailsCard'
import { ConstructionSystemsCard }       from './sections/ConstructionSystemsCard'
import { FeaturesAmenitiesCard }         from './sections/FeaturesAmenitiesCard'
import { PropertySectionNav } from './sections/PropertySectionNav'

interface PropertyDetailViewProps {
  property: RealEstateProperty
  onEdit:   (p: RealEstateProperty) => void
  onDelete: (p: RealEstateProperty) => void
}

// Enterprise Polish pass (2026-07-22): introduced this page's own responsive
// gutter scale in place of a single flat `px-6` everywhere.
// Layout Architecture pass (2026-07-25): that scale is now `PAGE_PADDING_X`
// imported from `../lib/page-layout` — it stacked with DashboardShell's own
// `<main>` padding (this page renders nested inside it), compounding to 56px
// of edge inset at `xl`+ with no page-level lever left to reduce it. See
// that file for the full before/after numbers.

export function PropertyDetailView({ property, onEdit, onDelete }: PropertyDetailViewProps) {
  const { t } = useTranslation('properties')
  const router = useRouter()
  useFavoriteState(property.id)

  const { displayName, displayLocation, breadcrumbLabel, heroGalleryIds, sectionNavItems } =
    buildPropertyDetailPageViewModel(property, t)

  // Derived intelligence
  const narrative = buildPropertyNarrative(property)

  // Media Gallery Consistency pass (2026-07-24). Single source of truth for
  // "which photo is showing" and "is the fullscreen viewer open," shared by
  // the Hero banner (its own inline carousel AND its lightbox-open trigger)
  // and Asset Management's Photos tab (its tile grid's lightbox-open
  // trigger) — both read and write the exact same two primitives, so
  // there's no separate sync step: clicking the Hero banner opens the
  // shared viewer at whatever index the Hero was already showing, and
  // navigating inside the viewer (arrows/keyboard/swipe/thumbnail) updates
  // the same index the Hero banner itself will still be showing after the
  // viewer closes. `heroGalleryIds` (Banner-first, deduped, gallery order
  // preserved — see detail-page.viewmodel.ts) is the one array both
  // consumers render from; Asset Management no longer computes its own,
  // separate, Banner-excluding photo list.
  //
  // Live-verified this needed to go further than shared *state*: Hero and
  // Asset Management each rendering their own `<MediaLightbox>` — even both
  // driven by this same state — still produced two separate Radix Dialog
  // instances, both opening together (confirmed live: two `[role="dialog"]`
  // elements, both `data-state="open"`, simultaneously). "Never create a
  // second Lightbox" means exactly one `<MediaLightbox>` element in the
  // whole tree, not two elements that happen to agree — so it's rendered
  // once, here, and Hero/Asset Management only ever call these setters,
  // never render a MediaLightbox of their own for Photos again.
  const [mediaIndex, setMediaIndex] = useState(0)
  const [mediaLightboxOpen, setMediaLightboxOpen] = useState(false)
  const [mediaErrored, setMediaErrored] = useState<Set<string>>(new Set())
  const mediaTriggerRef = useRef<HTMLElement | null>(null)

  function resolveMedia(id: string | null | undefined, size?: 'small' | 'medium' | 'large'): string {
    if (!id || mediaErrored.has(id)) return FALLBACK_IMAGE
    return getWebAssetUrl(id, size)
  }
  function onMediaErr(id: string) { setMediaErrored(s => new Set([...s, id])) }

  function navToProperty(p: RealEstateProperty) {
    router.push(`/properties/${buildEntitySlug(p.propertyCode, p.id)}`)
  }

  return (
    <div className="min-h-0">
      {/* max-w-450 (1800px, up from 1600px — see page-layout.ts): the page's
          real "avoid large empty margins at 1920px+" lever, since gutter
          padding intentionally stays modest at every tier per that file. */}
      <div className="mx-auto max-w-450 pb-20">

        {/* ── Breadcrumb ── */}
        <div className={cn('mb-5 flex items-center gap-3 pt-6', PAGE_PADDING_X)}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t('detail.goBack')}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              'border border-border/30 bg-card text-muted-foreground/58',
              'shadow-[0_1px_3px_rgba(0,0,0,0.05)]',
              'transition-[colors,shadow] duration-150 hover:border-border/50 hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <nav aria-label={t('detail.breadcrumb')} className="flex items-center gap-1.5 text-[12px]">
            <Link
              href="/properties"
              className="font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {t('detail.breadcrumbProperties')}
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/35" />
            <span className="font-semibold text-foreground">{breadcrumbLabel}</span>
          </nav>
        </div>

        {/* ── In-page section navigation (Interaction Design Sprint 4) ──
            Sticky wayfinding over the existing IA — jumps to the same
            zones below, reorders nothing, adds nothing new to read. */}
        <div className={PAGE_PADDING_X}>
          <PropertySectionNav items={sectionNavItems} />
        </div>

        {/* ── Layout architecture: Main Content + Independent Aside ──
            This page is deliberately NOT two equal-height columns. Main
            content owns the document flow — every section from Hero
            through Timeline is one continuous column, and what follows it
            starts as soon as IT finishes. Command Hub is an independent
            aside beside that column, never a participant in its flow: it
            does not gate, stretch, or get stretched by anything else on
            the page. If main content ever gets split back into multiple
            grid rows (e.g. to "match" the aside), CSS Grid's default
            stretch will reintroduce artificial whitespace under whichever
            row finishes first — this is a layout constraint to preserve,
            not a styling preference to relitigate per change. See below
            for the mechanics and history. ──
        ── Responsive architecture (2026-07-19, rebalanced 2026-07-25b,
            re-architected 2026-07-25c — Main Content + Independent Aside) ──
            The sidebar previously lived in a proportional 3-of-12 grid
            column (a plain fr share of the row), so its width was a flat
            percentage all the way down — it visibly compressed (clipped
            labels, cramped KPI rows) across the entire 1024–1500px range.
            That was fixed by pinning the sidebar to a literal 360px track,
            which solved the compression but overcorrected the other way:
            360px is a *ceiling* as much as a floor, so Command Hub stayed
            exactly 360px wide even at 1920px+, shrinking to as little as
            ~20% of the row while the Overview column absorbed all the
            extra space. `minmax(380px, 38%)` keeps the 2026-07-19 floor
            (never narrower than 380px) while letting the track grow
            proportionally with the row past that point.

            The row-level bug: this used to be a genuine two-ROW grid —
            "Overview" (Hero/Brief/Description) alone in row 1, Command Hub
            spanning row-start-1/row-span-2 beside it, and everything else
            (Financial…Contacts) in row 2. CSS Grid items default to
            `align-items: stretch`, so when Command Hub (KPIs + agent card +
            quick actions) is taller than "Overview" alone — the ordinary
            case, not an edge case — row 1 had to grow to fit it, which
            stretched the *row-2* cell (Financial…Contacts) to match,
            trapping empty space inside a cell whose own content had
            already finished. Timeline/RelatedProperties, as siblings
            *after* this whole grid, couldn't start until both rows —
            gated by Command Hub's height — finished. That's the reported
            "large empty area under the left column."

            Fix: one continuous main-content column (below) holding every
            section from Hero through Timeline in literal DOM order —
            Overview and "the rest" are no longer separate grid rows, so
            there's nothing for Command Hub's height to stretch. Command
            Hub is now compared against the *entire* main flow (row 1
            only, no row-span), which is reliably far taller than one
            sidebar card, so the row's height is simply main content's own
            natural height — Command Hub just sits beside however much of
            it fits. RelatedPropertiesSection stays a sibling after this
            grid (it fetches independently and was never part of the IA
            reading order below), so it naturally continues right after
            main content ends, same as everything else now does.

            The aside cell intentionally does NOT get `items-start`/
            `self-start`/`h-fit` here despite that being the literal ask —
            OperationsCommandHub's own root already carries a deliberate
            `xl:sticky xl:top-20` (see that file's own comment; not an
            oversight, not to be touched — "do not patch individual
            cards"). A sticky element's scroll *travel range* is bounded by
            its containing block's height: forcing this cell to fit-content
            would remove the room Command Hub's own sticky needs to stay
            pinned while the (now much longer) main column scrolls past it.
            The grid's default stretch on *this* cell is what makes that
            existing sticky behavior work — it was only ever a bug on the
            *other* cell (row 2), which no longer exists. The visible card
            already renders at its own natural content size regardless
            (`position: sticky` doesn't stretch an element's own box), so
            "fit-content, aligned to top, independent" is satisfied by the
            child's existing styling, not by anything added here.

            Below `xl` there usually isn't reliably enough room for a
            380px+ sidebar next to a comfortable main column, so the grid
            collapses to one column — and because main content and Command
            Hub are the only two grid children now, in that literal order,
            the stacked mobile/tablet reading order is just plain DOM order
            (Hero → Command Hub → rest), no `order` utility needed. */}
        <div className={cn('grid grid-cols-1 gap-5 pt-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,38%)]', PAGE_PADDING_X)}>

          {/*
            IA Sprint 3 (2026-07-18) — reading order now follows the buyer/
            agent decision flow instead of Wizard-capture order:
            1. What is this?        → Hero
            2. Is it interesting?   → Executive Brief, Listing Description
            3. How much?            → Financial Intelligence
            4. Where is it?         → Location, Address & Coordinates
            5. What condition?      → Specifications, Construction, Land
                                       Details, Amenities
            6. Media & documents    → Asset Management
            7. Who owns it?         → Contacts (Owner/Agent live in the
                                       sticky Command Hub sidebar, answered
                                       throughout, not just at this point)
            8. What happened?       → Timeline
            Full rationale for every move in the IA Implementation Report.
            Zone wrappers below carry the ids PropertySectionNav jumps to —
            navigation only, no change to what's inside each zone. One
            continuous flex column now (was: two separate grid-row
            children) — see the grid wrapper's own comment above for why.
          */}
          <div className="flex min-w-0 flex-col gap-4 xl:col-start-1 xl:row-start-1">

            {/* 1 + 2. Hero, Executive Brief, Listing Description */}
            <div id="section-overview" className="scroll-mt-28 flex flex-col gap-4">
              <PropertyIntelligenceHeroSection
                viewModel={buildHeroViewModel(property, heroGalleryIds, displayName, displayLocation)}
                activeIndex={mediaIndex}
                onActiveIndexChange={setMediaIndex}
                onLightboxOpenChange={setMediaLightboxOpen}
                triggerRef={mediaTriggerRef}
              />
              <ExecutiveBriefingCard
                viewModel={buildBriefingViewModel(narrative, property, displayName)}
              />
              <ListingDescriptionCard viewModel={buildDescriptionViewModel(property)} />
            </div>

            {/* 3. Financial Intelligence (status badge and Photos pill
                removed — both duplicated Command Hub / Asset Management) */}
            <div id="section-financial" className="scroll-mt-28">
              <FinancialIntelligenceOS data={buildFinancialViewModel(property)} />
            </div>

            {/* 4. Where is it — Location (map) split from Address &
                Coordinates (factual/scannable), two cards instead of one
                very tall combined one. */}
            <div id="section-location" className="scroll-mt-28 flex flex-col gap-4">
              <LocationIntelligenceCenter property={property} />
              <AddressCoordinatesPanel data={buildAddressCoordinatesViewModel(property)} />
            </div>

            {/* 5. What condition is it in — Specifications, Construction,
                Land Details (adjacent — both answer "what is it,
                structurally"), Amenities. */}
            <div id="section-specs" className="scroll-mt-28 flex flex-col gap-4">
              <PropertySpecsBar viewModel={buildSpecsViewModel(property)} onViewFullSpecs={undefined} />
              <ConstructionSystemsCard viewModel={buildConstructionViewModel(property)} />
              <LandDetailsCard viewModel={buildLandViewModel(property)} />
              <FeaturesAmenitiesCard viewModel={buildFeaturesViewModel(property)} />
            </div>

            {/* 6. Media & documents */}
            <div id="section-media" className="scroll-mt-28">
              <AssetManagementSystem
                viewModel={buildAssetsViewModel(property, heroGalleryIds, t)}
                onPhotoIndexChange={setMediaIndex}
                onPhotoLightboxOpenChange={setMediaLightboxOpen}
                photoTriggerRef={mediaTriggerRef}
              />
            </div>

            {/* 7. Who's related to this listing */}
            <div id="section-contacts" className="scroll-mt-28">
              <ContactsCard viewModel={buildContactsViewModel(property)} />
            </div>

            {/* 8. What happened — Timeline (merged Intelligence Stream +
                Activity Panel: one chronological history instead of two
                unrelated "what happened" cards). Its own `mt-4` on top of
                the column's `gap-4` (not `space-y-*`'s child-margin
                injection, which a plain `mt-*` on one child can't reliably
                override due to selector specificity) is what still gives
                Timeline the larger separation it always had as a
                page-level section — even though it's no longer a
                page-level sibling. */}
            <div id="section-timeline" className="scroll-mt-28 mt-4">
              <PropertyTimeline
                viewModel={buildTimelineViewModel(
                  property,
                  property.calls ?? [],
                  property.meetings ?? [],
                  property.tasks ?? [],
                  t,
                )}
              />
            </div>

          </div>

          {/* ── Command Hub — a `minmax(380px, 38%)` track at `xl` and
              above (see the grid wrapper's own comment above for the full
              rationale, including why this cell keeps the default stretch
              instead of `h-fit`/`self-start`); stacks after main content
              below `xl`. The 380px floor lives on the grid track itself,
              not this cell, so no width utility is needed here — a fixed
              `min-w` on the child would either fight the track's own floor
              or (per the Enterprise Polish pass, 2026-07-22) leak into the
              stacked single-column layout below `xl` and overflow a
              narrow phone, which is exactly why that floor was moved to be
              `xl:`-scoped grid-track math instead of an unconditional cell
              width. ── */}
          <div className="xl:col-start-2 xl:row-start-1">
            <OperationsCommandHub
              viewModel={buildOperationsViewModel(property)}
              onEdit={() => onEdit(property)}
            />
          </div>

        </div>

        {/* ── Similar Properties ── */}
        <RelatedPropertiesSection
          currentId={property.id}
          type={property.type}
          onView={navToProperty}
          onEdit={onEdit}
          onDelete={onDelete}
        />

      </div>

      {/* Media Gallery Consistency pass (2026-07-24). The one and only
          fullscreen media viewer on this page — see this file's own
          `mediaIndex`/`mediaLightboxOpen` note above. Both the Hero banner
          and Asset Management's Photos tab are pure triggers now: they only
          call `setMediaIndex`/`setMediaLightboxOpen` and write into
          `mediaTriggerRef`, never render a MediaLightbox of their own. */}
      <MediaLightbox
        ids={heroGalleryIds}
        resolve={resolveMedia}
        onErr={onMediaErr}
        openIndex={mediaLightboxOpen ? mediaIndex : null}
        onOpenChange={setMediaLightboxOpen}
        onNavigate={setMediaIndex}
        triggerRef={mediaTriggerRef}
        subtitle={breadcrumbLabel}
        category={t('assets.tabs.photos')}
      />
    </div>
  )
}
