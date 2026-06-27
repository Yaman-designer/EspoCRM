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
import { PropertyIntelligenceHeroSection } from './sections/PropertyIntelligenceHeroSection'
import { PropertySpecsBar }              from './sections/PropertySpecsBar'
import { FinancialIntelligenceOS }       from './sections/FinancialIntelligenceOS'
import { PropertyIntelligenceStream }    from './sections/PropertyIntelligenceStream'
import { AssetManagementSystem }         from './sections/AssetManagementSystem'
import { LocationIntelligenceCenter }    from './sections/LocationIntelligenceCenter'
import { OperationsCommandHub }          from './sections/OperationsCommandHub'
import { RelatedPropertiesSection }      from './sections/RelatedPropertiesSection'

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

        {/* ── Two-column layout: left scrolls, right sticky ── */}
        <div className="grid grid-cols-1 gap-5 px-6 lg:grid-cols-12">

          {/* ── Left column (Executive Briefing → Location) ── */}
          <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-9">

            {/* Executive Intelligence Briefing */}
            <ExecutiveBriefingCard
              narrative={narrative}
              property={property}
              displayName={displayName}
            />

            {/* Hero */}
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
              purpose={property.purpose}
              yearBuilt={property.yearBuilt}
              energyClass={property.energyClass}
              isPremium={property.isPremium}
              isFeatured={property.isFeatured}
              isVerified={property.isVerified}
            />

            {/* Specs Bar */}
            <PropertySpecsBar
              property={property}
              onViewFullSpecs={undefined}
            />

            {/* Financial Intelligence OS */}
            <FinancialIntelligenceOS
              price={property.price}
              square={property.square}
              type={property.type}
              status={property.status}
              purpose={property.purpose}
              yearBuilt={property.yearBuilt}
              createdAt={property.createdAt}
              modifiedAt={property.modifiedAt}
              imagesIds={property.imagesIds}
            />

            {/* Intelligence Stream */}
            <PropertyIntelligenceStream
              property={property}
            />

            {/* Asset Management System */}
            <AssetManagementSystem property={property} />

            {/* Location Intelligence Center */}
            <LocationIntelligenceCenter property={property} />

          </div>

          {/* ── Right sidebar — Operations Command Hub (sticky on desktop) ── */}
          <div className="order-1 lg:order-2 lg:col-span-3">
            <OperationsCommandHub
              property={property}
              onEdit={() => onEdit(property)}
              onDelete={() => onDelete(property)}
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
    </div>
  )
}
