'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFavoriteState } from '../hooks/useFavoriteState'
import { getDisplayName, getDisplayLocation } from '../lib/display'
import { buildPropertyHealth } from '../lib/property-health'
import { buildPropertyNarrative } from '../lib/property-narrative'
import type { RealEstateProperty } from '../types/property.types'

import { ExecutiveBriefingCard }         from './sections/ExecutiveBriefingCard'
import { ListingDescriptionCard }        from './sections/ListingDescriptionCard'
import { PropertyIntelligenceHeroSection } from './sections/PropertyIntelligenceHeroSection'
import { PropertySpecsBar }              from './sections/PropertySpecsBar'
import { FinancialIntelligenceOS }       from './sections/FinancialIntelligenceOS'
import { PropertyTimeline }              from './sections/PropertyTimeline'
import { AssetManagementSystem }         from './sections/AssetManagementSystem'
import { LocationIntelligenceCenter, AddressCoordinatesPanel } from './sections/LocationIntelligenceCenter'
import { OperationsCommandHub }          from './sections/OperationsCommandHub'
import { RelatedPropertiesSection }      from './sections/RelatedPropertiesSection'
import { ContactsCard }                  from './sections/ContactsCard'
import { LandDetailsCard }               from './sections/LandDetailsCard'
import { ConstructionSystemsCard }       from './sections/ConstructionSystemsCard'
import { FeaturesAmenitiesCard }         from './sections/FeaturesAmenitiesCard'
import { PropertySectionNav, type SectionNavItem } from './sections/PropertySectionNav'

interface PropertyDetailViewProps {
  property: RealEstateProperty
  onEdit:   (p: RealEstateProperty) => void
  onDelete: (p: RealEstateProperty) => void
}

export function PropertyDetailView({ property, onEdit, onDelete }: PropertyDetailViewProps) {
  const router = useRouter()
  useFavoriteState(property.id)

  const displayName     = getDisplayName(property)
  const displayLocation = getDisplayLocation(property)
  const breadcrumbLabel = property.propertyCode ?? displayName ?? 'Property Details'

  // Derived intelligence
  const health    = buildPropertyHealth(property)
  const narrative = buildPropertyNarrative(property)

  function navToProperty(p: RealEstateProperty) {
    const slug = (p.propertyCode ?? p.id).toLowerCase()
    router.push(`/properties/${slug}`)
  }

  // Interaction Design Sprint 4 (2026-07-18) — in-page navigation targets.
  // Every id below already anchors a zone wrapper further down; Contacts is
  // the only zone whose card can fully self-hide, so it's the only one
  // conditionally included here.
  const hasContacts = (property.contactsIds?.length ?? 0) > 0
  const sectionNavItems: SectionNavItem[] = [
    { id: 'section-overview',      label: 'Overview' },
    { id: 'section-financial',     label: 'Financial' },
    { id: 'section-location',      label: 'Location' },
    { id: 'section-specs',         label: 'Specifications' },
    { id: 'section-media',         label: 'Media' },
    ...(hasContacts ? [{ id: 'section-contacts', label: 'Contacts' }] : []),
    { id: 'section-timeline',      label: 'Timeline' },
  ]

  return (
    <div className="min-h-0">
      <div className="mx-auto max-w-400 pb-20">

        {/* ── Breadcrumb ── */}
        <div className="mb-5 flex items-center gap-3 px-6 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
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
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px]">
            <Link
              href="/properties"
              className="font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              Properties
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/35" />
            <span className="font-semibold text-foreground">{breadcrumbLabel}</span>
          </nav>
        </div>

        {/* ── In-page section navigation (Interaction Design Sprint 4) ──
            Sticky wayfinding over the existing IA — jumps to the same
            zones below, reorders nothing, adds nothing new to read. */}
        <div className="px-6">
          <PropertySectionNav items={sectionNavItems} />
        </div>

        {/* ── Responsive architecture (2026-07-19) ─────────────────────────
            The sidebar previously lived in a proportional 3-of-12 grid
            column, so its width was a percentage of the available row —
            it visibly compressed (clipped labels, cramped KPI rows) across
            the entire 1024–1500px range, before growing back to a usable
            width only on very wide screens. Fixed here with explicit CSS
            Grid placement: the sidebar is a literal 360px track, never a
            fraction, so it can't be squeezed. Below `xl` there usually
            isn't reliably enough room for a 360px sidebar next to a
            comfortable main column, so the grid collapses to one column
            instead of letting both sides keep shrinking — and because
            Overview, Command Hub, and the remaining sections are three
            separate grid children in that literal order, the stacked
            mobile/tablet reading order is just plain DOM order (Hero →
            Command Hub → rest), no `order` utility needed. At `xl` and
            above, Command Hub spans both of the left column's rows
            (row-start-1 row-span-2) so it sits beside the entire
            scrolling column, not just the Hero. */}
        <div className="grid grid-cols-1 gap-5 px-6 pt-5 xl:grid-cols-[minmax(0,1fr)_360px]">

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
            navigation only, no change to what's inside each zone.
          */}

          {/* 1 + 2. Hero, Executive Brief, Listing Description */}
          <div id="section-overview" className="scroll-mt-28 min-w-0 space-y-4 xl:col-start-1 xl:row-start-1">
            <PropertyIntelligenceHeroSection
              mainImageId={property.mainImageId}
              imageIds={property.imagesIds}
              title={displayName}
              location={displayLocation}
              status={property.status}
              type={property.type}
              propertyCode={property.propertyCode}
              price={property.price}
              health={health}
              square={property.square}
              bedroomCount={property.bedroomCount}
              requestType={property.requestType}
              yearBuilt={property.yearBuilt}
              energyClass={property.energyClass}
              isPremium={property.isPremium}
              isFeatured={property.isFeatured}
              isVerified={property.isVerified}
              isNewListing={property.isNewListing}
            />
            <ExecutiveBriefingCard
              narrative={narrative}
              property={property}
              displayName={displayName}
            />
            <ListingDescriptionCard property={property} />
          </div>

          {/* ── Command Hub — a fixed, never-shrinking 360px track;
              stacks between Overview and the rest below `xl`. ── */}
          <div className="min-w-85 xl:col-start-2 xl:row-start-1 xl:row-span-2">
            <OperationsCommandHub
              property={property}
              onEdit={() => onEdit(property)}
              onDelete={() => onDelete(property)}
            />
          </div>

          {/* Remaining sections (3–7) — one column, same track as Overview
              on desktop (row 2, beneath it), directly after Command Hub
              when stacked. */}
          <div className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-2">

            {/* 3. Financial Intelligence (status badge and Photos pill
                removed — both duplicated Command Hub / Asset Management) */}
            <div id="section-financial" className="scroll-mt-28">
              <FinancialIntelligenceOS
                price={property.price}
                square={property.square}
                type={property.type}
                requestType={property.requestType}
                yearBuilt={property.yearBuilt}
                createdAt={property.createdAt}
                modifiedAt={property.modifiedAt}
                initialPrice={property.initialPrice}
                objectiveValue={property.objectiveValue}
                lowerPriceLimit={property.lowerPriceLimit}
                vat={property.vat}
                cRemuneration={property.cRemuneration}
                investment={property.investment}
                cRentalprice={property.cRentalprice}
                withinMonthlyUtilities={property.withinMonthlyUtilities}
                cAverageMonthlyUtilities={property.cAverageMonthlyUtilities}
                exchangeScheme={property.exchangeScheme}
                exchangeSchemePercentage={property.exchangeSchemePercentage}
                cConsideration={property.cConsideration}
                cCompensationFactor={property.cCompensationFactor}
              />
            </div>

            {/* 4. Where is it — Location (map) split from Address &
                Coordinates (factual/scannable), two cards instead of one
                very tall combined one. */}
            <div id="section-location" className="scroll-mt-28 space-y-4">
              <LocationIntelligenceCenter property={property} />
              <AddressCoordinatesPanel property={property} />
            </div>

            {/* 5. What condition is it in — Specifications, Construction,
                Land Details (adjacent — both answer "what is it,
                structurally"), Amenities. */}
            <div id="section-specs" className="scroll-mt-28 space-y-4">
              <PropertySpecsBar property={property} onViewFullSpecs={undefined} />
              <ConstructionSystemsCard property={property} />
              <LandDetailsCard property={property} />
              <FeaturesAmenitiesCard property={property} />
            </div>

            {/* 6. Media & documents */}
            <div id="section-media" className="scroll-mt-28">
              <AssetManagementSystem property={property} />
            </div>

            {/* 7. Who's related to this listing */}
            <div id="section-contacts" className="scroll-mt-28">
              <ContactsCard property={property} />
            </div>

          </div>

        </div>

        {/* 8. What happened — Timeline (merged Intelligence Stream +
            Activity Panel: one chronological history instead of two
            unrelated "what happened" cards) */}
        <div id="section-timeline" className="scroll-mt-28 px-6 mt-12">
          <PropertyTimeline
            property={property}
            calls={property.calls ?? []}
            meetings={property.meetings ?? []}
            tasks={property.tasks ?? []}
          />
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
    </div>
  )
}
