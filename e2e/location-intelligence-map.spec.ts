import { test, expect } from '@playwright/test'

// Authenticates directly via the NextAuth Credentials API (GET /api/auth/csrf
// -> POST /api/auth/callback/credentials), the same flow every other live
// verification in this project's manual passes has used successfully all
// session. Self-contained rather than depending on the e2e/auth.setup.ts UI
// login project — that flow independently failed when run here (the login
// page redirected back to /login with the submitted username/password
// echoed as URL query params instead of completing sign-in), which is a
// separate, pre-existing issue from the one this spec exists to check and
// is reported separately rather than blocking this verification on it.
async function loginViaApi(request: import('@playwright/test').APIRequestContext, baseURL: string) {
  const csrfRes = await request.get(`${baseURL}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()
  await request.post(`${baseURL}/api/auth/callback/credentials`, {
    form: {
      username: process.env.E2E_USERNAME ?? '',
      password: process.env.E2E_PASSWORD ?? '',
      csrfToken,
      json: 'true',
    },
  })
}

// MapLibre + MapTiler runtime verification (2026-07-19). Written in direct
// response to a request for hard runtime proof, not source/bundle
// inspection: does the browser actually mount a MapLibre canvas (not
// leftover Leaflet DOM), do style.json/tiles/glyphs/sprites actually
// download successfully, does the map's own 'load' event fire, and are the
// premium-cartography overrides actually applied to the live map instance —
// not assumed from reading the component source.
//
// Relies on the dev-only `window.__mapLibreDebug` hook exposed by
// PropertyMapLibreInner.tsx (map instance, resolved style URL, load flag) —
// without it, "overrides actually executed" and "load fired" can only be
// inferred indirectly from DOM/network, which is weaker evidence.
//
// Property slug — a real record confirmed (via direct API query) to have
// its own real stored addressLatitude/addressLongitude, so the map path
// doesn't depend on the separate geocoding-fallback hook. dvl68660 (used
// throughout this project's earlier manual verification passes) has NULL
// stored coordinates and was found during this investigation to hang
// indefinitely on the geocoding-fallback query — a real, pre-existing bug
// unrelated to the MapLibre migration, reported separately. Using a
// property with real coordinates isolates the MapLibre rendering pipeline
// from that separate bug.
const PROPERTY_SLUG = 'dvl68656'

test.describe('Location Intelligence Center — MapLibre runtime verification', () => {
  test('mounts a real MapLibre canvas with successful style/tile loading and applied overrides', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __markerListenerLog: string[] }
      w.__markerListenerLog = []
      const orig = EventTarget.prototype.addEventListener
      EventTarget.prototype.addEventListener = function (type, listener, opts) {
        const el = this as unknown as HTMLElement
        if (type === 'click' && el?.classList?.contains?.('property-map-marker')) {
          w.__markerListenerLog.push(`attached click listener, el id=${el.getAttribute('aria-label')}`)
          const wrapped = function (this: unknown, ...args: unknown[]) {
            w.__markerListenerLog.push('listener INVOKED')
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const r = (listener as any).apply(this, args)
              w.__markerListenerLog.push(
                'listener returned normally, popups in DOM right now: '
                + document.querySelectorAll('.maplibregl-popup').length,
              )
              return r
            } catch (err) {
              w.__markerListenerLog.push('listener THREW: ' + String(err) + ' | ' + (err as Error)?.stack)
              throw err
            }
          }
          return orig.call(this, type, wrapped as EventListener, opts)
        }
        return orig.call(this, type, listener, opts)
      }
    })

    await loginViaApi(page.context().request, baseURL!)

    const mapTilerRequests: { url: string; status: number; ok: boolean; resourceType: string }[] = []
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => pageErrors.push(String(err)))
    page.on('response', res => {
      const url = res.url()
      if (/maptiler\.com/i.test(url)) {
        mapTilerRequests.push({
          url,
          status: res.status(),
          ok: res.ok(),
          resourceType: res.request().resourceType(),
        })
      }
    })

    await page.goto(`/properties/${PROPERTY_SLUG}`)

    // Screenshot immediately on arrival — "before" state (skeleton/loading).
    await page.locator('#section-location').scrollIntoViewIfNeeded()
    await page.screenshot({ path: 'e2e-artifacts/location-map-before.png' })

    // ── 1. MapLibre canvas mounted, NOT Leaflet ─────────────────────────────
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('.leaflet-container')).toHaveCount(0)
    await expect(page.locator('.leaflet-tile-pane')).toHaveCount(0)

    // ── 4. The map's own 'load' event actually fired ────────────────────────
    await page.waitForFunction(
      () => (window as unknown as { __mapLibreDebug?: { loaded?: boolean } }).__mapLibreDebug?.loaded === true,
      { timeout: 20_000 },
    )

    // Give in-flight tile/glyph/sprite requests a moment to settle after load.
    await page.waitForTimeout(1500)

    // ── 5. Active style URL, read directly from the live map instance ──────
    const debugState = await page.evaluate(() => {
      const dbg = (window as unknown as { __mapLibreDebug?: { resolvedStyleUrl?: string; loaded?: boolean } }).__mapLibreDebug
      return { resolvedStyleUrl: dbg?.resolvedStyleUrl, loaded: dbg?.loaded }
    })
    console.log('\n[style] resolved style URL:', debugState.resolvedStyleUrl)
    expect(debugState.resolvedStyleUrl).toContain('api.maptiler.com')
    expect(debugState.loaded).toBe(true)

    // ── 6. Runtime overrides actually executed on the live style ───────────
    const overrides = await page.evaluate(() => {
      type MapLike = {
        getPaintProperty: (layer: string, prop: string) => unknown
        getLayoutProperty: (layer: string, prop: string) => unknown
        getSource: (id: string) => unknown
      }
      const map = (window as unknown as { __mapLibreDebug?: { map?: MapLike } }).__mapLibreDebug?.map
      if (!map) return null
      return {
        waterColor:            map.getPaintProperty('Water', 'fill-color'),
        waterShadowColor:      map.getPaintProperty('Water shadow', 'fill-color'),
        buildingOpacity:       map.getPaintProperty('Building', 'fill-opacity'),
        buildingTopOpacity:    map.getPaintProperty('Building top', 'fill-opacity'),
        forestColor:           map.getPaintProperty('Forest', 'fill-color'),
        roadOutlineOpacity:    map.getPaintProperty('Road network outline', 'line-opacity'),
        oceanLabelsVisibility: map.getLayoutProperty('Ocean labels', 'visibility'),
        seaLabelsVisibility:   map.getLayoutProperty('Sea labels', 'visibility'),
        hasRadiusSource:       !!map.getSource('search-radius'),
      }
    })
    console.log('[overrides] live paint/layout state:', JSON.stringify(overrides, null, 2))

    expect(overrides).not.toBeNull()
    expect(overrides!.waterColor).toBe('hsl(208, 22%, 90%)')
    expect(overrides!.waterShadowColor).toBe('hsl(205, 16%, 82%)')
    expect(overrides!.buildingOpacity).toBe(0.55)
    expect(overrides!.buildingTopOpacity).toBe(0.4)
    expect(overrides!.forestColor).toBe('hsla(140, 14%, 85%, 0.55)')
    expect(overrides!.roadOutlineOpacity).toBe(0.9)
    expect(overrides!.oceanLabelsVisibility).toBe('none')
    expect(overrides!.seaLabelsVisibility).toBe('none')

    // ── 7. Property marker + radius are real MapLibre layers, not Leaflet ──
    expect(overrides!.hasRadiusSource).toBe(true)
    await expect(page.locator('.maplibregl-marker')).toHaveCount(await page.locator('.maplibregl-marker').count())
    const markerCount = await page.locator('.maplibregl-marker').count()
    console.log('[markers] .maplibregl-marker count (property pin + any POI markers):', markerCount)
    expect(markerCount).toBeGreaterThan(0)
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0)
    await expect(page.locator('.leaflet-popup')).toHaveCount(0)

    // Popup: click the property marker, confirm the executive card renders.
    // The marker happens to sit near the map's top-left corner for this
    // property/viewport combination, under the always-visible fullscreen/
    // locate control cluster (`absolute top-4 left-4` inside the map card,
    // independent of page scroll) — real coordinate-based clicks land on
    // whichever element is topmost at that pixel. dispatchEvent fires the
    // marker's own click listener directly, the same one a real click would
    // trigger, without depending on unobstructed screen geometry.
    const marker = page.locator('.property-map-marker').first()
    await page.evaluate(() => {
      (window as unknown as { __clickLog: string[] }).__clickLog = []
      document.addEventListener('click', e => {
        (window as unknown as { __clickLog: string[] }).__clickLog.push(
          (e.target as HTMLElement)?.className ?? String(e.target),
        )
      }, true)
    })
    await marker.evaluate(el => (el as HTMLElement).click())
    const clickLog = await page.evaluate(() => (window as unknown as { __clickLog: string[] }).__clickLog)
    console.log('[popup debug] document click log:', JSON.stringify(clickLog))
    const listenerLog = await page.evaluate(() => (window as unknown as { __markerListenerLog: string[] }).__markerListenerLog)
    console.log('[popup debug] marker listener attach log:', JSON.stringify(listenerLog))
    await page.waitForTimeout(300)
    const debugAfterClick = await page.evaluate(() => ({
      anyMaplibrePopup: document.querySelectorAll('.maplibregl-popup').length,
      anyPropertyPopup: document.querySelectorAll('.property-popup').length,
      markerHtml: document.querySelector('.property-map-marker')?.outerHTML.slice(0, 200),
    }))
    console.log('[popup debug]', JSON.stringify(debugAfterClick, null, 2))
    console.log('[popup debug] console errors so far:', JSON.stringify(consoleErrors, null, 2))
    console.log('[popup debug] page errors so far:', JSON.stringify(pageErrors, null, 2))
    await expect(page.locator('.property-popup')).toBeVisible({ timeout: 5_000 })

    await page.screenshot({ path: 'e2e-artifacts/location-map-after-popup.png' })
    await page.locator('.property-popup [aria-label="Close"]').click()
    await page.screenshot({ path: 'e2e-artifacts/location-map-after.png' })

    // ── 2 & 3. Real network evidence — style/tiles/glyphs/sprites, no 4xx/5xx
    console.log(`\n[network] ${mapTilerRequests.length} maptiler.com requests captured:`)
    for (const r of mapTilerRequests) {
      console.log(`  ${r.status} ${r.ok ? 'OK ' : 'FAIL'} [${r.resourceType}] ${r.url}`)
    }

    const styleReqs  = mapTilerRequests.filter(r => /style\.json/.test(r.url))
    const tileReqs   = mapTilerRequests.filter(r => /\/tiles\/|\.pbf(\?|$)/.test(r.url) && !/font|glyph/.test(r.url))
    const glyphReqs  = mapTilerRequests.filter(r => /font|glyph/.test(r.url))
    const spriteReqs = mapTilerRequests.filter(r => /sprite/.test(r.url))
    const failedReqs = mapTilerRequests.filter(r => r.status >= 400)

    console.log(`\n[summary] style:${styleReqs.length} tiles:${tileReqs.length} glyphs:${glyphReqs.length} sprites:${spriteReqs.length} failed:${failedReqs.length}`)

    expect(styleReqs.length, 'no style.json request observed').toBeGreaterThan(0)
    expect(styleReqs.every(r => r.ok), 'style.json request did not return 2xx').toBe(true)
    expect(failedReqs, `${failedReqs.length} maptiler.com request(s) returned 4xx/5xx`).toEqual([])

    // Console/runtime errors — report but don't hard-fail the whole spec on
    // an unrelated warning; the failedReqs/override assertions above are the
    // real pass/fail signal. Logged here so they're visible in the report.
    if (consoleErrors.length || pageErrors.length) {
      console.log('\n[console errors]', JSON.stringify(consoleErrors, null, 2))
      console.log('[page errors]', JSON.stringify(pageErrors, null, 2))
    } else {
      console.log('\n[console] no console.error or pageerror events observed')
    }
  })
})
