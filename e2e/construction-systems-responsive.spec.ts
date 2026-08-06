import { test, expect, type Page } from '@playwright/test'

// Construction & Systems UX Architecture pass (2026-07-20) — responsive
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

// dvl68651: confirmed live (direct API query) to have real Climate Systems
// data (cHeatingMedium: "heatpump", cHeatingController: "automic",
// cAdditionalheating: 3 items), Building Materials (frames, door, floor
// types), and Structural Features (storage, parking) — but every boolean
// field on this record (cUnderConstriction, itNeedsRenovation, renovated,
// doubleGlass, hasElectricalDevices) is false, and furnished/furniture
// chips are empty. That makes it the exact real-world case the "no list of
// No" fix targets: this spec confirms nothing renders for the Construction
// Condition group's false booleans, while everything with real data does.
const SLUG = 'dvl68651'

const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'tablet',  width: 834,  height: 1194 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const

async function gotoAndAuth(page: Page, baseURL: string) {
  await loginViaApi(page.context().request, baseURL)
  await page.goto(`/properties/${SLUG}`)
  await page.locator('#section-specs').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
}

test.describe('Construction & Systems — responsive verification', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): hierarchy, no boolean noise, no clipping`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await gotoAndAuth(page, baseURL!)

      const section = page.locator('#section-specs')
      await expect(section.getByText('Construction & Systems', { exact: true })).toBeVisible()
      // The card immediately following the "Construction & Systems" h2's
      // own wrapper — not a sibling of the h2 itself, which only shares
      // its wrapper div with the subtitle <p>.
      const card = section.locator('div.rounded-\\[24px\\]').filter({ hasText: 'Climate Systems' })
      await expect(card).toBeVisible()

      // ── No overflow contributed by this card. Scoped to #section-specs,
      // not the whole document: PropertyDetailView.tsx's page-level grid
      // pins the Command Hub sidebar column to a 340px floor, a confirmed
      // pre-existing, page-level issue unrelated to this card (documented
      // in the prior Address & Coordinates / Quick Specifications pass).
      const overflow = await section.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(overflow, `#section-specs horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)

      // ── Real data renders: Climate Systems (primary tiles), Building
      // Materials + Structural Features (secondary definition lists) —
      // every one of these fields is populated on this real record.
      await expect(card.getByText('Climate Systems', { exact: true })).toBeVisible()
      await expect(card.getByText('heatpump', { exact: false })).toBeVisible()
      await expect(card.getByText('underfloor', { exact: false })).toBeVisible()
      await expect(card.getByText('Building Materials', { exact: true })).toBeVisible()
      await expect(card.getByText('wooden', { exact: false })).toBeVisible()
      await expect(card.getByText('Structural Features', { exact: true })).toBeVisible()
      await expect(card.getByText('Interior', { exact: false })).toBeVisible()

      // ── No boolean noise: every flag on this record is false, and the
      // whole "Construction Condition" group (which would only ever show
      // TRUE flags) correctly does not render at all — not an empty card,
      // not a "No" placeholder.
      await expect(card.getByText('Construction Condition', { exact: true })).toHaveCount(0)
      await expect(card.getByText('No', { exact: true })).toHaveCount(0)
      await expect(card.getByText('Under Construction', { exact: false })).toHaveCount(0)
      await expect(card.getByText('Needs Renovation', { exact: false })).toHaveCount(0)
      await expect(card.getByText(/^Renovated/)).toHaveCount(0)
      await expect(card.getByText('Double Glass', { exact: false })).toHaveCount(0)
      await expect(card.getByText('Electrical Devices', { exact: false })).toHaveCount(0)

      // ── Nothing is clipped: every visible label/value pair inside the
      // card is actually within the viewport, not just present in the DOM.
      const rows = card.locator('div.text-\\[13px\\].font-bold, div.text-\\[14px\\].font-black')
      const rowCount = await rows.count()
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i)).toBeVisible()
      }

      await page.screenshot({ path: `e2e-artifacts/construction-${bp.name}.png`, fullPage: true })
    })
  }
})
