'use client'

/**
 * Inner Leaflet map — imported only on the client via dynamic() to avoid SSR
 * issues (Leaflet accesses `window` at module load time).
 *
 * Do NOT import this file directly from server-rendered code.
 * Use PropertyMap.tsx which wraps it with `dynamic({ ssr: false })`.
 */

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

function buildPropertyIcon(): L.DivIcon {
  const html = `
    <div style="
      width:46px;height:46px;
      background:#0061BC;
      border-radius:50%;
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 18px rgba(0,97,188,0.55),0 2px 8px rgba(0,0,0,0.12);
      transition:transform 0.15s ease;
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

// ── Popup content ─────────────────────────────────────────────────────────────

function PropertyPopup({
  title,
  propertyCode,
  areaName,
}: {
  title?:        string
  propertyCode?: string
  areaName?:     string
}) {
  return (
    <div style={{ minWidth: 160, padding: '2px 0' }}>
      {title && (
        <p style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: '#101828',
          lineHeight: 1.4,
          fontFamily: 'var(--font-sans, system-ui)',
        }}>
          {title}
        </p>
      )}
      {propertyCode && (
        <p style={{
          margin: '3px 0 0',
          fontSize: 11,
          fontWeight: 600,
          color: '#0061BC',
          fontFamily: 'var(--font-sans, system-ui)',
          letterSpacing: '0.04em',
        }}>
          {propertyCode}
        </p>
      )}
      {areaName && (
        <p style={{
          margin: '4px 0 0',
          fontSize: 11,
          color: '#667085',
          fontFamily: 'var(--font-sans, system-ui)',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          📍 {areaName}
        </p>
      )}
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
}

export function PropertyMapLeaflet({
  latitude,
  longitude,
  title,
  propertyCode,
  areaName,
}: PropertyMapLeafletProps) {
  const markerIcon = buildPropertyIcon()

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      style={{ height: '100%', width: '100%', background: '#f0f4f8' }}
      zoomControl={false}
      scrollWheelZoom={false}
      attributionControl={false}
    >
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

      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup className="property-popup" closeButton={false} minWidth={160}>
          <PropertyPopup
            title={title}
            propertyCode={propertyCode}
            areaName={areaName}
          />
        </Popup>
      </Marker>

      <MapController lat={latitude} lon={longitude} />
    </MapContainer>
  )
}
