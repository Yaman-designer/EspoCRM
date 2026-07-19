'use client'

/**
 * Inner Leaflet map — imported only on the client via dynamic() to avoid SSR
 * issues (Leaflet accesses `window` at module load time).
 *
 * Do NOT import this file directly from server-rendered code.
 * Use PropertyMap.tsx which wraps it with `dynamic({ ssr: false })`.
 */

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap, Tooltip as LeafletTooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Copy, Navigation, Share2, LocateFixed, ExternalLink, Check, Maximize2, X, HelpCircle,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import {
  buildGoogleMapsUrl, buildGoogleDirectionsUrl,
} from '../services/geocoding.service'
import type { NearbyPlace } from '../services/geocoding.service'

// ── Fix Leaflet's default icon paths broken by webpack asset hashing ──────────
// We bypass the default icon entirely and use our own DivIcon, so this is only
// needed if other parts of the app ever use L.Icon.Default.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

// ── Custom property marker ────────────────────────────────────────────────────
// Interactive Map Experience phase. Wrapped in .property-marker-pin (globals.css
// handles hover/focus/active elevation + drop-shadow) inside .property-map-marker
// (the DivIcon's own className — that's what carries the entrance animation and
// is what Leaflet's default `keyboard: true` marker option makes Tab-focusable
// and Enter/Space-activatable without any extra wiring here).

function buildPropertyIcon(): L.DivIcon {
  const html = `
    <div class="property-marker-pin" style="
      width:46px;height:46px;
      background:#0061BC;
      border-radius:50%;
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 18px rgba(0,97,188,0.55),0 2px 8px rgba(0,0,0,0.12);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="white" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
  `
  return L.divIcon({
    html,
    iconSize:   [46, 46],
    iconAnchor: [23, 46],
    popupAnchor:[0, -52],
    className:  'property-map-marker',
  })
}

// ── Nearby-place marker ────────────────────────────────────────────────────
// Enterprise Geospatial pass (2026-07-19). A small neutral-gray dot — the
// cartographic style reserves blue for the property marker, the active
// search radius, and a hovered/selected POI (globals.css: .poi-marker /
// .poi-marker:hover), so a screen full of same-category pins never
// competes with the one thing this map exists to point at. Every pin here
// comes from `nearby`, the real Overpass-sourced result the section
// already fetches — nothing invented, no new query.
function buildPoiIcon(): L.DivIcon {
  const html = `<div class="poi-marker-dot"></div>`
  return L.divIcon({
    html,
    iconSize:   [12, 12],
    iconAnchor: [6, 6],
    className:  'poi-marker',
  })
}

// ── Smooth fly-to when coordinates change ─────────────────────────────────────

function MapController({ lat, lon }: { lat: number; lon: number }) {
  const map    = useMap()
  const prevRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    const prev = prevRef.current
    if (prev && (prev[0] !== lat || prev[1] !== lon)) {
      map.flyTo([lat, lon], 15, { duration: 0.8 })
    }
    prevRef.current = [lat, lon]
  }, [lat, lon, map])

  return null
}

// ── Map controls — recenter + open in Google Maps ──────────────────────────
// Interactive Map Experience phase. A native-feeling small control cluster,
// separate from Leaflet's own ZoomControl (bottom-right) and the accuracy/
// availability badges LocationIntelligenceCenter overlays (top-right) — this
// sits top-left so nothing competes for the same corner.

function MapControls({
  lat, lon, mapsUrl, onFullscreenClick,
}: {
  lat: number
  lon: number
  mapsUrl: string | null
  onFullscreenClick?: () => void
}) {
  const map = useMap()

  function recenter() {
    map.flyTo([lat, lon], 15, { duration: 0.6 })
  }

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: 16, marginLeft: 16 }}>
      <div className="leaflet-control" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onFullscreenClick && (
          <button
            type="button"
            onClick={onFullscreenClick}
            aria-label="View map fullscreen"
            title="Fullscreen"
            className="property-map-control-btn"
          >
            <Maximize2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={recenter}
          aria-label="Recenter map on property"
          title="Recenter on property"
          className="property-map-control-btn"
        >
          <LocateFixed size={16} />
        </button>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open location in Google Maps"
            title="Open in Google Maps"
            className="property-map-control-btn"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  )
}

// ── Popup content — executive property card ──────────────────────────────────
// Popup Density pass (2026-07-19). Rebuilt from a flat stack of badges
// (Type in a filled blue box, a colored Approximate/Exact pill, six
// equal-weight bordered icon buttons) into exactly the tiered structure
// this pass specifies: Property → Address/Coordinates → Accuracy/Updated →
// Primary Action → Secondary Actions, each tier separated by a single
// hairline rather than every element carrying its own border. Coordinates
// and Accuracy are now plain metadata text, not KPI-styled badges — the
// property's name and the "Open in Google Maps" button are the only two
// things on this card meant to draw the eye. Secondary actions trimmed to
// the four the brief lists (Copy / Share / Directions / Locate); "Expand
// location details" and the platform-conditional Apple Maps link are
// dropped, not hidden — six actions of equal visual weight was exactly the
// "too many equal-weight actions" finding. Every field is still sourced
// from data PropertyMapLeafletProps already receives — nothing new is
// fetched or fabricated.

function IconAction({
  icon: Icon, label, done, ...rest
}: {
  icon:  typeof Copy
  label: string
  done?: boolean
} & (
  | { as: 'button'; onClick: () => void }
  | { as: 'a'; href: string }
)) {
  const content = rest.as === 'a' ? (
    <a
      href={rest.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      data-done={done}
      className="property-popup-icon-btn"
    >
      {done ? <Check size={14} /> : <Icon size={14} />}
    </a>
  ) : (
    <button
      type="button"
      onClick={rest.onClick}
      aria-label={label}
      data-done={done}
      className="property-popup-icon-btn"
    >
      {done ? <Check size={14} /> : <Icon size={14} />}
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

function PopupDivider() {
  return <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F2F4' }} />
}

function PropertyPopupCard({
  title, propertyCode, areaName, city, propertyType, status,
  isApproximate, geocodeType, lastUpdated, latitude, longitude, addressText,
}: {
  title?:         string
  propertyCode?:  string
  areaName?:      string
  city?:          string
  propertyType?:  string
  status?:        string
  isApproximate?: boolean
  geocodeType?:   string
  lastUpdated?:   string
  latitude:       number
  longitude:      number
  addressText?:   string
}) {
  const map = useMap()
  const { copied, copy } = useCopyToClipboard()
  const [shared, setShared] = useState(false)

  const mapsUrl       = buildGoogleMapsUrl({ latitude, longitude })
  const directionsUrl = buildGoogleDirectionsUrl({ latitude, longitude })

  // Escape closes the popup — Leaflet handles outside-click and the header's
  // own close button, but binds nothing to Escape by default.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') map.closePopup()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [map])

  async function handleShare() {
    const shareUrl = mapsUrl ?? `https://www.google.com/maps?q=${latitude},${longitude}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: title || 'Property Location', url: shareUrl })
      } catch {
        // User cancelled the native share sheet — not an error, no-op.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 1500)
    } catch { /* clipboard unavailable — silently ignore */ }
  }

  function centerMap() {
    map.flyTo([latitude, longitude], 15, { duration: 0.6 })
  }

  // Copy consolidates the previous two copy actions (address, coordinates)
  // into the one the brief's structure lists — the address when there is
  // one (the more useful value to relay to a client), the coordinates
  // otherwise.
  function handleCopy() {
    void copy(addressText ?? `${latitude}, ${longitude}`)
  }

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div
      role="dialog"
      aria-label={`${title || 'Property'} location details`}
      style={{ minWidth: 268, padding: '4px 2px', fontFamily: 'var(--font-sans, system-ui)' }}
    >
      <button
        type="button"
        onClick={() => map.closePopup()}
        aria-label="Close"
        style={{
          position: 'absolute', top: 4, right: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, flexShrink: 0,
          border: 'none', borderRadius: 6, background: 'transparent', color: '#98A2B3',
          cursor: 'pointer',
        }}
      >
        <X size={14} />
      </button>

      {/* Property — name is the one thing on this card set with real
          weight; type and status sit beneath it as one quiet line, no
          filled badge boxes. */}
      <div style={{ paddingRight: 22 }}>
        {title && (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#101828', lineHeight: 1.3 }}>
            {title}
            {propertyCode && (
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#98A2B3' }}>
                #{propertyCode}
              </span>
            )}
          </p>
        )}
        {(propertyType || status) && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 0', fontSize: 11.5, fontWeight: 600, color: '#475467' }}>
            {propertyType && <span style={{ textTransform: 'capitalize' }}>{propertyType}</span>}
            {propertyType && status && <span style={{ color: '#D0D5DD' }}>·</span>}
            {status && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'Active' ? '#12B76A' : '#98A2B3' }} />
                {status}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Address / Coordinates — coordinates are metadata beneath the
          address, not a tabular-numeral KPI of their own. Coordinates
          themselves are non-optional props, so this tier always renders;
          the address/area line above them is the only conditional part. */}
      <div>
        <PopupDivider />
        {addressText ? (
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#344054', lineHeight: 1.4 }}>{addressText}</p>
        ) : (areaName || city) ? (
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#344054' }}>
            {[areaName, city].filter(Boolean).join(' · ')}
          </p>
        ) : null}
        <p style={{ margin: (addressText || areaName || city) ? '3px 0 0' : 0, fontSize: 10.5, color: '#98A2B3', fontVariantNumeric: 'tabular-nums' }}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      </div>

      {/* Accuracy / Updated — plain metadata line, not a colored badge.
          The tooltip still carries the same explanation of what
          "Approximate" means; only the visual weight changed. */}
      <div>
        <PopupDivider />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 10.5, color: '#98A2B3' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default', fontWeight: 600 }}>
                {isApproximate ? 'Approximate location' : 'Exact location'}
                <HelpCircle size={10} style={{ opacity: 0.6 }} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" style={{ maxWidth: 220 }}>
              {isApproximate
                ? `Estimated from the property's location name, not its own stored coordinates — accurate to roughly a 350m radius${geocodeType ? ` (${geocodeType})` : ''}.`
                : "The property's own stored exact coordinates — not estimated."}
            </TooltipContent>
          </Tooltip>
          {lastUpdatedLabel && <span>Updated {lastUpdatedLabel}</span>}
        </div>
      </div>

      {/* Primary action */}
      {mapsUrl && (
        <div>
          <PopupDivider />
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="property-popup-primary-btn" style={{ marginTop: 0 }}>
            <ExternalLink size={13} />
            Open in Google Maps
          </a>
        </div>
      )}

      {/* Secondary actions — Copy / Share / Directions / Locate, ghost
          icon buttons (no border box per action), evenly spaced. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <IconAction
          as="button"
          icon={Copy}
          label={copied ? 'Copied' : addressText ? 'Copy address' : 'Copy coordinates'}
          done={copied}
          onClick={handleCopy}
        />
        <IconAction
          as="button"
          icon={Share2}
          label={shared ? 'Location link copied' : 'Share location'}
          done={shared}
          onClick={handleShare}
        />
        {directionsUrl && (
          <IconAction as="a" icon={Navigation} label="Get directions" href={directionsUrl} />
        )}
        <IconAction as="button" icon={LocateFixed} label="Locate on map" onClick={centerMap} />
      </div>
    </div>
  )
}

// ── PropertyMapLeaflet ────────────────────────────────────────────────────────

export interface PropertyMapLeafletProps {
  latitude:       number
  longitude:      number
  title?:         string
  propertyCode?:  string
  areaName?:      string
  // Interactive Map Experience phase.
  status?:        string
  isApproximate?: boolean
  addressText?:   string
  // Location Intelligence popup redesign. All three sourced from fields the
  // caller already has on hand (property.type, property.addressCity,
  // property.modifiedAt, property.addressGeocodeType) — nothing new is
  // fetched to support them.
  propertyType?:  string
  city?:          string
  lastUpdated?:   string
  geocodeType?:   string
  // Address Business Group, Phase 3. Both optional and undefined by
  // default — every existing caller (PropertyLocationCard.tsx's read-only
  // detail-page display) is unaffected. Only LocationMapPreview.tsx (the
  // wizard) passes these, to let a user fine-tune the pin after an Address
  // Search selection.
  draggable?:         boolean
  onPositionChange?:  (lat: number, lon: number) => void
  // Interactive Map Experience phase. Optional — only the Details page's
  // fullscreen Dialog trigger passes this; every other caller (Wizard
  // preview, the compact PropertyMap wrapper) simply omits the button.
  onFullscreenClick?: () => void
  // Enterprise Geospatial pass (2026-07-19). Both optional and undefined by
  // default — every existing caller (Wizard preview, PropertyLocationCard,
  // the compact PropertyMap wrapper) is unaffected. Only
  // LocationIntelligenceCenter passes these, using the real Overpass
  // results it already fetches via useNearbyPlaces — no new query, no new
  // endpoint. `nearbyPlaces` pre-filtered to the active filter category by
  // the caller; this component just plots what it's given and draws the
  // radius that was actually searched.
  nearbyPlaces?:  NearbyPlace[]
  searchRadiusM?: number
}

export function PropertyMapLeaflet({
  latitude,
  longitude,
  title,
  propertyCode,
  areaName,
  status,
  isApproximate,
  addressText,
  propertyType,
  city,
  lastUpdated,
  geocodeType,
  draggable = false,
  onPositionChange,
  onFullscreenClick,
  nearbyPlaces,
  searchRadiusM,
}: PropertyMapLeafletProps) {
  const markerIcon = buildPropertyIcon()
  const poiIcon = buildPoiIcon()
  const mapsUrl = buildGoogleMapsUrl({ latitude, longitude })
  // Viewport-aware popup width — a fixed 300px can overflow a narrow phone
  // screen with no margin either side; this leaves room on both.
  const popupMaxWidth = typeof window !== 'undefined' ? Math.min(300, window.innerWidth - 56) : 300

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      className="premium-cartography"
      style={{ height: '100%', width: '100%', background: '#f6f5f1' }}
      zoomControl={false}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      {/* Premium cartography pass (2026-07-19): still CARTO Positron — the
          real, already-integrated monochrome basemap, no engine or tile
          source swapped — with a CSS contrast/saturation filter
          (globals.css: .premium-cartography) so its road hierarchy reads
          as a deliberate architectural line drawing rather than a washed-
          out, flat canvas at typical property zoom levels. */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
        subdomains="abcd"
      />

      {/* Attribution — smaller, bottom right */}
      <div className="leaflet-bottom leaflet-right">
        <div
          className="leaflet-control leaflet-attribution"
          style={{ fontSize: 9, opacity: 0.6, margin: '0 8px 8px 0' }}
        >
          © OpenStreetMap · CARTO
        </div>
      </div>

      <ZoomControl position="bottomright" />
      <MapControls lat={latitude} lon={longitude} mapsUrl={mapsUrl} onFullscreenClick={onFullscreenClick} />

      {/* Accuracy radius — only meaningful (and only drawn) when the pin is a
          geocoded approximation, not the property's own stored exact
          coordinates. Radius is a deliberately round, honest "this is
          roughly the area" guide, not a computed margin-of-error. */}
      {isApproximate && (
        <Circle
          center={[latitude, longitude]}
          radius={350}
          pathOptions={{
            color: '#0061BC',
            weight: 1,
            fillColor: '#0061BC',
            fillOpacity: 0.08,
          }}
        />
      )}

      {/* Search radius — the actual area the Overpass query covered, not a
          travel-time estimate (Sprint 2's Data Authenticity Certification
          already established why: no real routing/isochrone data exists to
          back one). Only drawn while a nearby-places layer is active. */}
      {searchRadiusM != null && (
        <Circle
          center={[latitude, longitude]}
          radius={searchRadiusM}
          pathOptions={{
            color: '#0061BC',
            weight: 1.25,
            dashArray: '4 5',
            fillColor: '#0061BC',
            fillOpacity: 0.035,
          }}
        />
      )}

      {/* Nearby-place layer — real Overpass results for the active filter
          category, plotted as neutral dots (monochrome cartography; blue
          stays reserved for the property marker and this radius). */}
      {nearbyPlaces?.map(place => (
        <Marker key={place.id} position={[place.lat, place.lon]} icon={poiIcon}>
          <LeafletTooltip direction="top" offset={[0, -4]} opacity={1} className="poi-tooltip">
            {place.name} · {place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`}
          </LeafletTooltip>
        </Marker>
      ))}

      <Marker
        position={[latitude, longitude]}
        icon={markerIcon}
        draggable={draggable}
        alt={title ? `${title} — property location` : 'Property location'}
        eventHandlers={{
          ...(draggable && onPositionChange ? {
            dragend: e => {
              const pos = e.target.getLatLng()
              onPositionChange(pos.lat, pos.lng)
            },
          } : {}),
          // Selected-state affordance — the marker gets a stronger elevation
          // while its own popup is open, distinguishing "currently inspecting"
          // from idle/hover (globals.css: .property-marker-active).
          popupopen:  e => e.target.getElement()?.classList.add('property-marker-active'),
          popupclose: e => e.target.getElement()?.classList.remove('property-marker-active'),
          // Leaflet's `alt` marker option is reliably applied to image-based
          // L.Icon markers but not guaranteed for a custom L.DivIcon like
          // this one — set the accessible name directly on the focusable
          // wrapper element Leaflet creates, once it exists in the DOM.
          add: e => {
            const el = e.target.getElement()
            if (el) {
              el.setAttribute('role', 'button')
              el.setAttribute('aria-label', title ? `${title} — view property location` : 'View property location')
            }
          },
        }}
      >
        <Popup
          className="property-popup"
          closeButton={false}
          minWidth={250}
          maxWidth={popupMaxWidth}
          autoPan
          autoPanPadding={[24, 24]}
        >
          <PropertyPopupCard
            title={title}
            propertyCode={propertyCode}
            areaName={areaName}
            city={city}
            propertyType={propertyType}
            status={status}
            isApproximate={isApproximate}
            geocodeType={geocodeType}
            lastUpdated={lastUpdated}
            latitude={latitude}
            longitude={longitude}
            addressText={addressText}
          />
        </Popup>
      </Marker>

      <MapController lat={latitude} lon={longitude} />
    </MapContainer>
  )
}
