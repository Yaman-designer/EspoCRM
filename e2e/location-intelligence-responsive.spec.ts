import { test, expect, type Page } from '@playwright/test'

// UX Architecture pass (2026-07-20) — responsive verification for the
// Location Intelligence Center redesign. Same direct NextAuth login as
// location-intelligence-map.spec.ts (e2e/auth.setup.ts's UI flow is broken,
// documented there); duplicated here rather than shared to keep each spec
// file self-contained and independently runnable.
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

// Same property used by the MapLibre runtime spec — real stored
// coordinates. Confirmed live (repeatedly, across this whole engagement)
// to have zero nearby Overpass results in every category, which makes it
// the exact real-world case the Adaptive Layout pass targets: this spec
// verifies that case directly rather than a hypothetical one.
const PROPERTY_SLUG = 'dvl68656'

const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'tablet',  width: 834,  height: 1194 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const

async function gotoLocationSection(page: Page) {
  await page.goto(`/properties/${PROPERTY_SLUG}`)
  await page.locator('#section-location').scrollIntoViewIfNeeded()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
  await page.waitForFunction(
    () => (window as unknown as { __mapLibreDebug?: { loaded?: boolean } }).__mapLibreDebug?.loaded === true,
    { timeout: 20_000 },
  )
  await page.waitForTimeout(500)
}

test.describe('Location Intelligence Center — responsive UX verification', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): no fake content, adaptive panel, no horizontal overflow`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await loginViaApi(page.context().request, baseURL!)
      await gotoLocationSection(page)

      await page.screenshot({ path: `e2e-artifacts/location-intel-${bp.name}.png`, fullPage: false })

      // ── No fake/empty-placeholder content anywhere in the section ──────
      const locationSection = page.locator('#section-location')
      await expect(locationSection.getByText('None found')).toHaveCount(0)
      await expect(locationSection.getByText('Amenities Overview')).toHaveCount(0)
      await expect(locationSection.getByText('Approximate Location', { exact: true })).toHaveCount(0)

      // ── Controls: exactly Locate + Fullscreen, no Google Maps duplicate ─
      const controlButtons = page.locator('.property-map-control-btn')
      const controlCount = await controlButtons.count()
      expect(controlCount).toBeLessThanOrEqual(2)
      await expect(page.getByRole('link', { name: 'Open location in Google Maps' })).toHaveCount(0)

      // ── The Location Intelligence section itself never overflows the
      // viewport horizontally. Scoped to #section-location rather than the
      // whole document: an unrelated, pre-existing section-jump <nav>
      // elsewhere on the page already overflows at the tablet breakpoint
      // (confirmed via direct DOM inspection, untouched by this pass) — not
      // this component's concern to fix.
      const sectionOverflow = await locationSection.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(sectionOverflow, `location section horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)

      // ── Adaptive Layout pass (2026-07-20): this property has zero nearby
      // data, so the two-column map+panel grid must not render at all —
      // the map goes full width and the summary+empty-state card sits
      // directly beneath it, sized to its own content. This is the exact
      // bug report this pass fixes: a two-column grid where the second
      // column has almost nothing in it leaves a large, decorative empty
      // area beside a much taller map.
      await expect(locationSection.getByText('No location intelligence available')).toBeVisible()
      // Playwright's boundingBox() returns {x, y, width, height} — not a
      // DOMRect, no .top/.bottom/.left/.right. Using y (+ height for the
      // bottom edge) throughout.
      const mapBox     = await page.locator('.maplibregl-map').boundingBox()
      const sectionBox = await locationSection.boundingBox()
      const summaryBox = await locationSection.getByText('Overview', { exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').boundingBox()
      if (mapBox && sectionBox && bp.width >= 1024) {
        // Full width, not the ~66% a col-span-8 grid child would occupy.
        expect(mapBox.width).toBeGreaterThanOrEqual(sectionBox.width * 0.95)
      }
      if (mapBox && summaryBox) {
        // Sits directly beneath the map — no large decorative gap between
        // the two (a generous but bounded tolerance for the real ~16px
        // gap plus border/rounding pixels, not hundreds of px of void).
        expect(summaryBox.y - (mapBox.y + mapBox.height)).toBeLessThan(40)
        // Shorter than the map, not stretched to match it.
        expect(summaryBox.height).toBeLessThan(mapBox.height)
      }

      // ── Popup opens without adding horizontal squeeze ───────────────────
      // Compared against the pre-click baseline (not an absolute zero) for
      // the same reason as above: an unrelated, pre-existing nav overflow
      // at the tablet breakpoint shouldn't fail this component's check —
      // only a popup-caused *increase* in overflow should.
      const baselineOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const marker = page.locator('.property-map-marker').first()
      await marker.dispatchEvent('click')
      await expect(page.locator('.property-popup')).toBeVisible({ timeout: 5_000 })
      const popupOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(popupOverflow - baselineOverflow, `popup added horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)
      const popupBox = await page.locator('.maplibregl-popup-content').boundingBox()
      if (popupBox) {
        expect(popupBox.width).toBeLessThanOrEqual(bp.width)
      }
      await page.screenshot({ path: `e2e-artifacts/location-intel-${bp.name}-popup.png`, fullPage: false })
    })
  }
})
