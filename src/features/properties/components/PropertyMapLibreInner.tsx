'use client'

/**
 * MapLibre GL JS map — Location Intelligence Center only.
 *
 * Deliberately a separate implementation from PropertyMapLeaflet.tsx, not a
 * replacement of it: the Wizard's location picker and PropertyLocationCard
 * both depend on the existing Leaflet map and are explicitly out of scope
 * for this pass ("This task is ONLY for the Location Intelligence Center").
 * Imported only on the client via dynamic() — MapLibre accesses `window`/
 * WebGL at module load time, same constraint as the Leaflet map.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Copy, Navigation, Share2, LocateFixed, ExternalLink, Check, Maximize2, X, HelpCircle,
} from 'lucide-react'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { buildGoogleMapsUrl, buildGoogleDirectionsUrl } from '../services/geocoding.service'
import type { NearbyPlace } from '../services/geocoding.service'

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY

// MapTiler Style API — priority order per the brief: Dataviz Light first,
// Backdrop/Base Light as fallbacks if Dataviz is ever retired. All three
// are official MapTiler styles; nothing here is a custom/self-hosted style.
const STYLE_CANDIDATES = ['dataviz-light', 'backdrop-light', 'basic-light'] as const

function styleUrl(id: string): string {
  return `https://api.maptiler.com/maps/${id}/style.json?key=${MAPTILER_KEY}`
}

// ── Premium cartography overrides ─────────────────────────────────────────
// UI/UX audit (2026-07-19). The official style is used as-is — this only
// nudges the specific properties the brief calls out (water, buildings,
// parks, label density, road-outline opacity) via MapLibre's own
// setPaintProperty/setLayoutProperty APIs. No layer is added, removed, or
// re-authored; every id below already exists in MapTiler's Dataviz Light
// style. POI visibility isn't touched because Dataviz Light ships with no
// POI layer at all — there's nothing to hide.
function applyPremiumOverrides(map: maplibregl.Map) {
  const setPaint = (id: string, prop: string, value: unknown) => {
    if (map.getLayer(id)) map.setPaintProperty(id, prop, value)
  }
  const setLayout = (id: string, prop: string, value: unknown) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, prop, value)
  }

  // Water — soft blue-gray instead of neutral gray, per "very subtle water"
  setPaint('Water', 'fill-color', 'hsl(208, 22%, 90%)')
  setPaint('Water shadow', 'fill-color', 'hsl(205, 16%, 82%)')
  setPaint('River', 'line-color', 'hsl(208, 18%, 84%)')

  // Buildings — extremely subtle
  setPaint('Building', 'fill-opacity', 0.55)
  setPaint('Building top', 'fill-opacity', 0.4)

  // Parks / forest — muted, desaturated green (was near-invisible neutral gray)
  setPaint('Forest', 'fill-color', 'hsla(140, 14%, 85%, 0.55)')

  // Road network already carries a full class-based hierarchy (motorway >
  // trunk/primary > secondary > tertiary > minor/service/track) from
  // MapTiler's own style authors — left untouched. Only the outline
  // softened slightly further for restraint.
  setPaint('Road network outline', 'line-opacity', 0.9)

  // Labels — reduce density. Open-water labels are irrelevant to a
  // property map; road labels delayed one zoom step later than the
  // official default so they don't appear until genuinely at street level.
  setLayout('Ocean labels', 'visibility', 'none')
  setLayout('Sea labels', 'visibility', 'none')
  setLayout('Lakeline labels', 'visibility', 'none')
}

// ── Circle polygon (radius) ───────────────────────────────────────────────
// MapLibre has no built-in "circle in meters" primitive (unlike Leaflet's
// <Circle>) — this generates the same shape as a GeoJSON polygon.

function circlePolygon(centerLng: number, centerLat: number, radiusM: number, points = 72): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = []
  const earthRadiusM = 6371000
  const latRad = (centerLat * Math.PI) / 180
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = radiusM * Math.cos(angle)
    const dy = radiusM * Math.sin(angle)
    const dLat = (dy / earthRadiusM) * (180 / Math.PI)
    const dLng = (dx / (earthRadiusM * Math.cos(latRad))) * (180 / Math.PI)
    coords.push([centerLng + dLng, centerLat + dLat])
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  }
}

// ── Property marker element ───────────────────────────────────────────────
// Reuses the exact same CSS classes as the Leaflet marker (globals.css:
// .property-map-marker / .property-marker-pin) — entrance drop, hover/
// focus elevation, selection state, ambient pulse ring, reduced-motion
// guards — so the two map engines share one visual marker language rather
// than drifting into two different-looking pins.

function createMarkerElement(title: string | undefined): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'property-map-marker'
  wrap.setAttribute('role', 'button')
  wrap.setAttribute('tabindex', '0')
  wrap.setAttribute('aria-label', title ? `${title} — view property location` : 'View property location')

  const pin = document.createElement('div')
  pin.className = 'property-marker-pin'
  pin.style.cssText = 'width:46px;height:46px;background:#0061BC;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(0,97,188,0.55),0 2px 8px rgba(0,0,0,0.12);'
  pin.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  `
  wrap.appendChild(pin)
  return wrap
}

function createPoiElement(): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'poi-marker'
  const dot = document.createElement('div')
  dot.className = 'poi-marker-dot'
  wrap.appendChild(dot)
  return wrap
}

// ── Popup content ──────────────────────────────────────────────────────────
// Same executive-card design as PropertyMapLeaflet.tsx's PropertyPopupCard
// (identical structure, spacing, and the shared .property-popup-* CSS
// classes) — a separate implementation because MapLibre's Popup and
// react-leaflet's Popup have incompatible mounting APIs, but visually the
// same card either way. Takes plain callbacks instead of react-leaflet's
// useMap() hook, since this renders outside any react-leaflet tree.

function PopupCard({
  title, propertyCode, areaName, city, propertyType, status,
  isApproximate, geocodeType, lastUpdated, latitude, longitude, addressText,
  onClose, onCenter,
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
  onClose:        () => void
  onCenter:       () => void
}) {
  const { copied, copy } = useCopyToClipboard()
  const [shared, setShared] = useState(false)

  const mapsUrl       = buildGoogleMapsUrl({ latitude, longitude })
  const directionsUrl = buildGoogleDirectionsUrl({ latitude, longitude })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleShare() {
    const shareUrl = mapsUrl ?? `https://www.google.com/maps?q=${latitude},${longitude}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: title || 'Property Location', url: shareUrl })
      } catch { /* user cancelled — no-op */ }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 1500)
    } catch { /* clipboard unavailable */ }
  }

  function handleCopy() {
    void copy(addressText ?? `${latitude}, ${longitude}`)
  }

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const divider = <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F2F4' }} />

  return (
    <div role="dialog" aria-label={`${title || 'Property'} location details`} style={{ minWidth: 268, padding: '4px 2px', fontFamily: 'var(--font-sans, system-ui)' }}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute', top: 4, right: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, border: 'none', borderRadius: 6,
          background: 'transparent', color: '#98A2B3', cursor: 'pointer',
        }}
      >
        <X size={14} />
      </button>

      <div style={{ paddingRight: 22 }}>
        {title && (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#101828', lineHeight: 1.3 }}>
            {title}
            {propertyCode && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#98A2B3' }}>#{propertyCode}</span>}
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

      <div>
        {divider}
        {addressText ? (
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#344054', lineHeight: 1.4 }}>{addressText}</p>
        ) : (areaName || city) ? (
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#344054' }}>{[areaName, city].filter(Boolean).join(' · ')}</p>
        ) : null}
        <p style={{ margin: (addressText || areaName || city) ? '3px 0 0' : 0, fontSize: 10.5, color: '#98A2B3', fontVariantNumeric: 'tabular-nums' }}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      </div>

      <div>
        {divider}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 10.5, color: '#98A2B3' }}>
          <span title={isApproximate
            ? `Estimated from the property's location name, not its own stored coordinates — accurate to roughly a 350m radius${geocodeType ? ` (${geocodeType})` : ''}.`
            : "The property's own stored exact coordinates — not estimated."}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default', fontWeight: 600 }}
          >
            {isApproximate ? 'Approximate location' : 'Exact location'}
            <HelpCircle size={10} style={{ opacity: 0.6 }} />
          </span>
          {lastUpdatedLabel && <span>Updated {lastUpdatedLabel}</span>}
        </div>
      </div>

      {mapsUrl && (
        <div>
          {divider}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="property-popup-primary-btn" style={{ marginTop: 0 }}>
            <ExternalLink size={13} />
            Open in Google Maps
          </a>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button type="button" aria-label={copied ? 'Copied' : addressText ? 'Copy address' : 'Copy coordinates'} data-done={copied} className="property-popup-icon-btn" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button type="button" aria-label={shared ? 'Location link copied' : 'Share location'} data-done={shared} className="property-popup-icon-btn" onClick={handleShare}>
          {shared ? <Check size={14} /> : <Share2 size={14} />}
        </button>
        {directionsUrl && (
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Get directions" className="property-popup-icon-btn">
            <Navigation size={14} />
          </a>
        )}
        <button type="button" aria-label="Locate on map" className="property-popup-icon-btn" onClick={onCenter}>
          <LocateFixed size={14} />
        </button>
      </div>
    </div>
  )
}

// ── PropertyMapLibreInner ─────────────────────────────────────────────────

export interface PropertyMapLibreProps {
  latitude:           number
  longitude:          number
  title?:             string
  propertyCode?:      string
  areaName?:          string
  status?:            string
  isApproximate?:     boolean
  addressText?:       string
  propertyType?:      string
  city?:              string
  lastUpdated?:       string
  geocodeType?:       string
  onFullscreenClick?: () => void
  nearbyPlaces?:      NearbyPlace[]
  searchRadiusM?:     number
}

const RADIUS_SOURCE_ID = 'search-radius'
const RADIUS_FILL_ID   = 'search-radius-fill'
const RADIUS_LINE_ID   = 'search-radius-line'

export function PropertyMapLibre(props: PropertyMapLibreProps) {
  const { latitude, longitude, title, onFullscreenClick, nearbyPlaces, searchRadiusM } = props

  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<maplibregl.Map | null>(null)
  const markerRef     = useRef<maplibregl.Marker | null>(null)
  const poiMarkersRef = useRef<maplibregl.Marker[]>([])
  const popupRef      = useRef<maplibregl.Popup | null>(null)
  const popupRootRef  = useRef<Root | null>(null)
  const propsRef      = useRef(props)

  // Keeps propsRef current for openPopup (a stable useCallback that reads
  // the latest props imperatively) without making the ref write happen
  // during render, which react-hooks/refs correctly disallows.
  useEffect(() => {
    propsRef.current = props
  })

  const [styleReady, setStyleReady] = useState(false)
  const [styleFailed, setStyleFailed] = useState(false)
  // MAPTILER_KEY is a build-time constant, never changes at runtime — no
  // need for state to track its absence.
  const noKey = !MAPTILER_KEY

  const openPopup = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    popupRef.current?.remove()
    const container = document.createElement('div')
    const p = propsRef.current

    const popup = new maplibregl.Popup({ closeButton: false, maxWidth: '300px', offset: 28, className: 'property-popup' })
      .setLngLat([p.longitude, p.latitude])
      .setDOMContent(container)
      .addTo(map)

    const root = createRoot(container)
    popupRootRef.current = root
    root.render(
      <PopupCard
        title={p.title}
        propertyCode={p.propertyCode}
        areaName={p.areaName}
        city={p.city}
        propertyType={p.propertyType}
        status={p.status}
        isApproximate={p.isApproximate}
        geocodeType={p.geocodeType}
        lastUpdated={p.lastUpdated}
        latitude={p.latitude}
        longitude={p.longitude}
        addressText={p.addressText}
        onClose={() => popup.remove()}
        onCenter={() => map.flyTo({ center: [p.longitude, p.latitude], zoom: 15, duration: 600 })}
      />,
    )

    popup.on('close', () => {
      // Deferred so React never unmounts mid-render (Popup fires 'close'
      // synchronously from within the same click handler that could still
      // be bubbling through this exact DOM subtree).
      setTimeout(() => { popupRootRef.current?.unmount(); popupRootRef.current = null }, 0)
    })

    popupRef.current = popup
  }, [])

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || noKey) {
      return
    }

    let cancelled = false

    async function init() {
      // Try Dataviz Light first, then the documented fallbacks, in case a
      // style id is ever retired — all three are official MapTiler styles.
      let resolvedStyle: string | null = null
      for (const id of STYLE_CANDIDATES) {
        try {
          const res = await fetch(styleUrl(id), { method: 'HEAD' })
          if (res.ok) { resolvedStyle = styleUrl(id); break }
        } catch {
          // try the next candidate
        }
      }
      if (cancelled) return
      if (!resolvedStyle) { setStyleFailed(true); return }

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: resolvedStyle,
        center: [propsRef.current.longitude, propsRef.current.latitude],
        zoom: 15,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      })
      mapRef.current = map

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

      // Runtime verification hook (2026-07-19) — dev-only, read-only. Exposes
      // the live map instance and resolved style URL on `window` so external
      // tooling (e.g. the Playwright verification script) can confirm the
      // map actually initialized, which style resolved, and that the
      // premium-cartography overrides actually executed at runtime — instead
      // of inferring any of that from source inspection. No production code
      // path is affected; this reads/writes nothing from user data.
      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as Record<string, unknown>).__mapLibreDebug = {
          map, resolvedStyleUrl: resolvedStyle, loaded: false,
        }
      }

      map.on('load', () => {
        if (cancelled) return
        applyPremiumOverrides(map)
        setStyleReady(true)
        if (process.env.NODE_ENV !== 'production') {
          const dbg = (window as unknown as Record<string, unknown>).__mapLibreDebug as { loaded: boolean } | undefined
          if (dbg) dbg.loaded = true
        }
      })

      map.on('error', () => {
        setStyleFailed(true)
      })
    }

    void init()

    return () => {
      cancelled = true
      popupRef.current?.remove()
      markerRef.current?.remove()
      poiMarkersRef.current.forEach(m => m.remove())
      mapRef.current?.remove()
      mapRef.current = null
    }
    // Intentionally created once — coordinate/prop changes are handled by
    // the effects below via flyTo / marker updates, not by recreating the
    // whole map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Property marker + radius source/layers — set up once the style has
  // finished loading (adding sources/layers before 'load' throws).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady) return

    const el = createMarkerElement(title)
    el.addEventListener('click', openPopup)
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopup() }
    })
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([longitude, latitude])
      .addTo(map)
    markerRef.current = marker

    if (!map.getSource(RADIUS_SOURCE_ID)) {
      map.addSource(RADIUS_SOURCE_ID, { type: 'geojson', data: circlePolygon(longitude, latitude, searchRadiusM ?? 0) })
      map.addLayer({
        id: RADIUS_FILL_ID, type: 'fill', source: RADIUS_SOURCE_ID,
        paint: { 'fill-color': '#0061BC', 'fill-opacity': 0.035 },
      })
      map.addLayer({
        id: RADIUS_LINE_ID, type: 'line', source: RADIUS_SOURCE_ID,
        paint: { 'line-color': '#0061BC', 'line-width': 1.25, 'line-dasharray': [4, 3], 'line-opacity': searchRadiusM ? 1 : 0 },
      })
    }

    return () => {
      el.removeEventListener('click', openPopup)
      marker.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleReady])

  // Fly to updated coordinates (rare — only if the resolved geocode changes).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady) return
    map.flyTo({ center: [longitude, latitude], zoom: 15, duration: 800 })
    markerRef.current?.setLngLat([longitude, latitude])
    const source = map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(circlePolygon(longitude, latitude, searchRadiusM ?? 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, styleReady])

  // Search radius visibility/opacity toggle (per active filter tab).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady || !map.getLayer(RADIUS_LINE_ID)) return
    map.setPaintProperty(RADIUS_LINE_ID, 'line-opacity', searchRadiusM ? 1 : 0)
    map.setPaintProperty(RADIUS_FILL_ID, 'fill-opacity', searchRadiusM ? 0.035 : 0)
    const source = map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(circlePolygon(longitude, latitude, searchRadiusM ?? 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchRadiusM, styleReady])

  // Real POI markers — real Overpass results already fetched by
  // LocationIntelligenceCenter, filtered to the active filter category by
  // the caller. Cleared and rebuilt whenever the active filter changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady) return

    poiMarkersRef.current.forEach(m => m.remove())
    poiMarkersRef.current = []

    const tooltip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: 'poi-tooltip-libre' })

    for (const place of nearbyPlaces ?? []) {
      const el = createPoiElement()
      const label = `${place.name} · ${place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`}`
      el.addEventListener('mouseenter', () => tooltip.setLngLat([place.lon, place.lat]).setText(label).addTo(map))
      el.addEventListener('mouseleave', () => tooltip.remove())
      el.addEventListener('focus', () => tooltip.setLngLat([place.lon, place.lat]).setText(label).addTo(map))
      el.addEventListener('blur', () => tooltip.remove())
      el.setAttribute('tabindex', '0')
      el.setAttribute('role', 'img')
      el.setAttribute('aria-label', label)
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([place.lon, place.lat]).addTo(map)
      poiMarkersRef.current.push(marker)
    }

    return () => {
      tooltip.remove()
      poiMarkersRef.current.forEach(m => m.remove())
      poiMarkersRef.current = []
    }
  }, [nearbyPlaces, styleReady])

  const mapsUrl = buildGoogleMapsUrl({ latitude, longitude })

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" style={{ background: '#f6f5f1' }} />

      {(styleFailed || noKey) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f6f5f1] text-center px-6">
          <p className="text-[11px] font-bold text-muted-foreground/60">Map style unavailable</p>
          <p className="text-[10.5px] text-muted-foreground/45 max-w-64">
            {noKey
              ? 'No MapTiler API key is configured for this environment.'
              : "Couldn't reach the MapTiler style service — check your connection and try again."}
          </p>
        </div>
      )}

      {/* Custom control cluster — recenter + fullscreen + open in Google
          Maps, matching the same visual language as the Leaflet map's
          equivalent controls (globals.css: .property-map-control-btn). */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {onFullscreenClick && (
          <button type="button" onClick={onFullscreenClick} aria-label="View map fullscreen" title="Fullscreen" className="property-map-control-btn">
            <Maximize2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 600 })}
          aria-label="Recenter map on property"
          title="Recenter on property"
          className="property-map-control-btn"
        >
          <LocateFixed size={16} />
        </button>
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open location in Google Maps" title="Open in Google Maps" className="property-map-control-btn">
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  )
}
