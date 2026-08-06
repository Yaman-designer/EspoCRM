import { test, expect, type Page } from '@playwright/test'

// Hero Image Interaction pass (2026-07-21). The Hero's Banner is a single
// image, not a gallery — carousel controls (prev/next, counter) must never
// render when there is only one resolvable Hero image (Banner, main photo,
// or first gallery photo — whichever the fallback chain lands on), and must
// fully return when there's more than one. Every control here is
// conditionally rendered in JSX (not hidden via CSS opacity/visibility), so
// "not present" below means removed from the DOM, not merely invisible.
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

// AND67026 — a real property with a mainImageId, no cBannerphotoId, and an
// empty gallery, found via a live search across 150 recent records for a
// property whose resolved Hero image count is exactly 1. No test data was
// fabricated.
const SINGLE_ID = '68d6524388fe4e909'
// DVL68660 — a real property whose resolved Hero image count is 3 (Banner +
// main photo + one gallery entry), already used elsewhere in this
// engagement to verify Banner/ordering behavior.
const MULTI_ID = '6a55e8cb1ecd0c61e'

const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'laptop',  width: 1280, height: 1000 },
  { name: 'tablet',  width: 834,  height: 1200 },
  { name: 'mobile',  width: 390,  height: 1400 },
] as const

async function gotoAndAuth(page: Page, baseURL: string, id: string) {
  await loginViaApi(page.context().request, baseURL)
  await page.goto(`/properties/${id}`)
  await page.waitForTimeout(500)
}

test.describe('Hero — single-image vs multi-image control visibility', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): single Hero image hides all carousel controls`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await gotoAndAuth(page, baseURL!, SINGLE_ID)

      const hero = page.locator('#section-overview').first()
      await expect(hero.getByText('#AND67026', { exact: true })).toBeVisible()

      // ── No carousel controls anywhere in the DOM — not hidden, absent.
      await expect(hero.getByRole('button', { name: 'Previous image' })).toHaveCount(0)
      await expect(hero.getByRole('button', { name: 'Next image' })).toHaveCount(0)

      // ── Everything else the brief requires kept is still there. (A later
      // same-day IA refinement removed the Hero's KPI panel entirely — its
      // job is identity only now: image, status, type, title, code,
      // address, already asserted above via the property code. Category/
      // Condition/Listing Age moved to Command Hub/Quick Specifications, or
      // were dropped as redundant with Financial Intelligence's own
      // "Listed" date — not asserted here since this section no longer
      // renders them.)
      await expect(hero.getByRole('button', { name: /View full screen/ })).toHaveCount(1)

      // ── The lightbox itself: no prev/next, no counter pill.
      await hero.getByRole('button', { name: /View .* photo full screen/ }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Previous image' })).toHaveCount(0)
      await expect(dialog.getByRole('button', { name: 'Next image' })).toHaveCount(0)
      await expect(dialog.getByText(/^\d+ \/ \d+$/)).toHaveCount(0)

      // ── ArrowRight is inert (no keydown listener attached at all for a
      // single image) — the dialog must stay open and unaffected.
      await page.keyboard.press('ArrowRight')
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    })

    test(`${bp.name} (${bp.width}x${bp.height}): multi-image Hero keeps the full carousel experience`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await gotoAndAuth(page, baseURL!, MULTI_ID)

      const hero = page.locator('#section-overview').first()
      await expect(hero.getByRole('button', { name: 'Previous image' })).toBeVisible()
      await expect(hero.getByRole('button', { name: 'Next image' })).toBeVisible()

      await hero.getByRole('button', { name: /View full screen/ }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Previous image' })).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Next image' })).toBeVisible()
      const counter = dialog.getByText(/^\d+ \/ \d+$/)
      const before = await counter.textContent()
      await page.keyboard.press('ArrowRight')
      await expect(counter).not.toHaveText(before!)
    })
  }
})
