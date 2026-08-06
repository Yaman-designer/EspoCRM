'use client'

import { useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MapPin, Loader2 } from 'lucide-react'
import { PropertyMap } from '@/features/properties/components/PropertyMap'
import { NearbyPlaces } from '@/features/properties/components/NearbyPlaces'
import { AddressSearch } from '@/features/properties/components/AddressSearch'
import { usePropertyLocation, useLocationCascadeNames } from '@/features/properties/hooks/usePropertyLocation'
import type { AddressSuggestion } from '@/features/properties/services/geocoding.service'

// Display/edit map preview shown below Step 2's location fields, reusing
// the existing Leaflet + geocoding stack already proven on the property
// detail page.
//
// Address Business Group, Phase 3 (Maps & Places) — addressLatitude/
// addressLongitude (Phase 2) are now this preview's primary coordinate
// source: if both are set, they're used directly, no geocoding call, no
// approximation — the map shows exactly what will be saved. The original
// coarse Region/Sub-Region/District cascade geocode (still watched below)
// is now a fallback only, used while those two fields are still empty
// (e.g. a brand-new record). Three ways populate the precise fields going
// forward, all funneling into the same addressLatitude/addressLongitude
// (and, for search, the rest of the Phase 2 canonical address fields) via
// form.setValue: Address Search selection, manually typing Latitude/
// Longitude in Step 2, or dragging the map pin.
//
// Everything this component sets stays on the canonical `address` composite
// (Phase 2's resolved decision) — never cLocationReal*.

interface LocationMapPreviewProps {
  form: UseFormReturn<Record<string, unknown>>
}

export function LocationMapPreview({ form }: LocationMapPreviewProps) {
  const { t } = useTranslation('properties')
  const locationId = useWatch({ control: form.control, name: 'locationId' }) as string | undefined
  const subRegionLocationId = useWatch({ control: form.control, name: 'subRegionLocationId' }) as string | undefined
  const regionLocationId = useWatch({ control: form.control, name: 'regionLocationId' }) as string | undefined
  const addressLatitude = useWatch({ control: form.control, name: 'addressLatitude' }) as number | undefined
  const addressLongitude = useWatch({ control: form.control, name: 'addressLongitude' }) as number | undefined

  // Rules of Hooks: usePropertyLocation must run unconditionally even when
  // its result ends up unused (precise coordinates already available) — its
  // own `enabled` flag (hasFields) already keeps it from firing needless
  // requests when the cascade itself is empty.
  const names = useLocationCascadeNames({ regionLocationId, subRegionLocationId, locationId })
  const { data: cascadeGeo, isFetching } = usePropertyLocation(names)

  const hasPreciseCoords = typeof addressLatitude === 'number' && !Number.isNaN(addressLatitude)
    && typeof addressLongitude === 'number' && !Number.isNaN(addressLongitude)

  const geo = hasPreciseCoords
    ? { latitude: addressLatitude as number, longitude: addressLongitude as number }
    : cascadeGeo

  const setOpts = { shouldDirty: true, shouldTouch: true }

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    if (suggestion.street !== undefined) form.setValue('addressStreet', suggestion.street, setOpts)
    if (suggestion.city !== undefined) form.setValue('addressCity', suggestion.city, setOpts)
    if (suggestion.state !== undefined) form.setValue('addressState', suggestion.state, setOpts)
    if (suggestion.postalCode !== undefined) form.setValue('addressPostalCode', suggestion.postalCode, setOpts)
    if (suggestion.country !== undefined) form.setValue('addressCountry', suggestion.country, setOpts)
    form.setValue('addressLatitude', suggestion.latitude, setOpts)
    form.setValue('addressLongitude', suggestion.longitude, setOpts)
  }

  const handlePositionChange = (lat: number, lon: number) => {
    form.setValue('addressLatitude', lat, setOpts)
    form.setValue('addressLongitude', lon, setOpts)
  }

  return (
    <div className="flex flex-col gap-4">
      <AddressSearch onSelect={handleAddressSelect} />

      {isFetching && !hasPreciseCoords ? (
        <div className="flex h-36 items-center justify-center gap-2 rounded-2xl border border-border/20 bg-muted/20 text-[13px] text-muted-foreground/60 sm:h-44">
          <Loader2 className="size-4 animate-spin text-muted-foreground/40" aria-hidden />
          {t('wizard.locationMap.locating')}
        </div>
      ) : !geo ? (
        <div className="flex h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/30 bg-muted/10 px-6 text-center sm:h-44">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/8 text-primary/70">
            <MapPin className="size-4" aria-hidden />
          </div>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-muted-foreground/60">
            {t('wizard.locationMap.emptyState')}
          </p>
        </div>
      ) : (
        <>
          <PropertyMap
            latitude={geo.latitude}
            longitude={geo.longitude}
            height={320}
            draggable
            onPositionChange={handlePositionChange}
          />
          <div className="rounded-[24px] border border-border/20 bg-card p-5">
            <NearbyPlaces latitude={geo.latitude} longitude={geo.longitude} />
          </div>
        </>
      )}
    </div>
  )
}
