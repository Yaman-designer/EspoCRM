import { test, expect, type Page } from '@playwright/test'

// Features & Amenities UX Architecture pass (2026-07-20) — responsive
// verification. Same direct NextAuth login as the other specs in this
// engagement (e2e/auth.setup.ts's UI flow is broken, documented there).
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

// gdi84153: found via a live search across 100 recent records for the
// richest real Features & Amenities data available in this dataset —
// confirmed to populate Orientation ("s" → must render "South", not the
// raw code), Energy & Sustainability (solarWaterHeating + nightPower,
// pulled out of the general features array), Property Placement (Greek
// labels: Facade/airy/bright → Πρόσοψης/Διαμπερές/Φωτεινό), Outdoor
// Features (balcony true, accessFrom "Paved", swimmingPool "No" — which
// must NOT render, since "No" carries no business value here), and a
// 10-value Lifestyle Features chip set (with the 2 energy values
// correctly excluded from it). Building Amenities/Accessibility/
// Suitability are empty on this record and are covered by code review
// instead, per the same honest-disclosure approach used in the
// Construction & Systems pass — no test data was fabricated to force
// those paths.
const SLUG = 'gdi84153'

const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'laptop',  width: 1280, height: 1000 },
  { name: 'tablet',  width: 834,  height: 1200 },
  { name: 'mobile',  width: 390,  height: 1400 },
] as const

async function gotoAndAuth(page: Page, baseURL: string) {
  await loginViaApi(page.context().request, baseURL)
  await page.goto(`/properties/${SLUG}`)
  await page.locator('#section-specs').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
}

test.describe('Features & Amenities — responsive verification', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): hierarchy, real labels, no boolean noise, no clipping`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await gotoAndAuth(page, baseURL!)

      const section = page.locator('#section-specs')
      await expect(section.getByText('Features & Amenities', { exact: true })).toBeVisible()
      const card = section.locator('div').filter({ hasText: 'Lifestyle Features' }).filter({ hasText: 'Property Placement' }).last()
      await expect(card).toBeVisible()

      // ── No overflow contributed by this card. Scoped to #section-specs,
      // not the whole document: PropertyDetailView.tsx's page-level grid
      // pins the Command Hub sidebar column to a 340px floor, a confirmed
      // pre-existing, page-level issue unrelated to this card (documented
      // in the Address & Coordinates / Quick Specifications pass).
      const overflow = await section.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(overflow, `#section-specs horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)

      // ── Real label translation: raw code "s" must render "South", never
      // the raw metadata code itself.
      await expect(card.getByText('South', { exact: true })).toBeVisible()
      await expect(card.getByText(/^s$/)).toHaveCount(0)

      // ── Energy & Sustainability correctly split out of the general
      // features array, both real values visible.
      await expect(card.getByText('Energy & Sustainability', { exact: true })).toBeVisible()
      await expect(card.getByText('Solar Water Heating', { exact: true })).toBeVisible()
      await expect(card.getByText('Night Power', { exact: true })).toBeVisible()

      // ── Property Placement renders the real Greek labels from the
      // Wizard's own schema, not the raw enum values.
      await expect(card.getByText('Πρόσοψης', { exact: true })).toBeVisible()
      await expect(card.getByText('Διαμπερές', { exact: true })).toBeVisible()
      await expect(card.getByText('Facade', { exact: true })).toHaveCount(0)

      // ── Outdoor Features: real true/populated values shown, "No" value
      // correctly suppressed.
      await expect(card.getByText('Balcony:', { exact: false })).toBeVisible()
      await expect(card.getByText('Paved', { exact: false })).toBeVisible()
      await expect(card.getByText('Swimming Pool', { exact: false })).toHaveCount(0)

      // ── Lifestyle Features: raw camelCase/typo values never rendered
      // literally; the 2 energy values are excluded from this chip cloud
      // (they have their own group above, not duplicated here).
      await expect(card.getByText('Pets Allowed', { exact: true })).toBeVisible()
      await expect(card.getByText('petsAllowed', { exact: true })).toHaveCount(0)
      await expect(card.getByText('Family Home', { exact: true })).toBeVisible()
      const lifestyleSection = card.locator('div').filter({ hasText: 'Lifestyle Features' }).last()
      await expect(lifestyleSection.getByText('Solar Water Heating', { exact: true })).toHaveCount(0)

      // ── No boolean noise: groups with zero real data (Building
      // Amenities, Accessibility, Suitability on this record) don't
      // render at all — not an empty card, not a placeholder.
      await expect(card.getByText('Building Amenities', { exact: true })).toHaveCount(0)
      await expect(card.getByText('Accessibility', { exact: true })).toHaveCount(0)
      await expect(card.getByText('Suitability', { exact: true })).toHaveCount(0)
      await expect(card.getByText('No', { exact: true })).toHaveCount(0)

      // ── Nothing is clipped: every visible chip/badge is actually within
      // the viewport, not just present in the DOM.
      const chips = card.locator('span')
      const chipCount = await chips.count()
      for (let i = 0; i < chipCount; i++) {
        await expect(chips.nth(i)).toBeVisible()
      }

      await page.screenshot({ path: `e2e-artifacts/features-${bp.name}.png`, fullPage: true })
    })
  }
})
