import { test, expect, type Page } from '@playwright/test'

// Information Architecture pass (2026-07-21). Verifies two independent
// changes: (1) the Hero now uses the property's Banner photo as its single
// visual identity instead of the main gallery photo, with the Banner card
// removed from Asset Management so the image exists only once; (2) Legal
// attachments whose stored filename is an image (jpg/jpeg/png/webp) get a
// real thumbnail and open in the same Asset Viewer used for Photos, tagged
// "Legal" rather than "Photos" in its header.
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

// DVL68660 — found via a live search across 200 recent records for a
// property carrying both a real cBannerphotoId AND a Document whose stored
// fileName ends in .jpg, the two real conditions this pass needed to
// exercise together. No test data was fabricated.
const BANNER_ID = '6a55e8cb1ecd0c61e'
// A property confirmed to have no cBannerphotoId — proves the fallback to
// mainImageId is unchanged from before this pass for the common case.
const NO_BANNER_ID = '6971e94d96c46a249'

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

test.describe('Hero Banner + Legal image attachments — verification', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): Hero uses Banner, no duplicate card, Legal images open in Asset Viewer`, async ({ page, baseURL, request }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })

      // Confirm live which asset id the Hero should be showing, straight
      // from the same API this page itself calls — not a hardcoded guess.
      await loginViaApi(request, baseURL!)
      const propRes = await request.get(`${baseURL}/api/espo/RealEstateProperty/${BANNER_ID}?select=cBannerphotoId,mainImageId`)
      const { cBannerphotoId } = await propRes.json()
      expect(cBannerphotoId, 'fixture property must have a real cBannerphotoId to test against').toBeTruthy()

      await gotoAndAuth(page, baseURL!, BANNER_ID)

      // ── Hero shows the Banner image specifically, not mainImageId ──────
      const heroImg = page.locator('#section-overview img').first()
      await expect(heroImg).toBeVisible()
      const heroSrc = await heroImg.getAttribute('src')
      expect(heroSrc, 'Hero <img> src must resolve the Banner attachment id').toContain(encodeURIComponent(cBannerphotoId))

      // ── Existing information hierarchy fully preserved — only the image
      // source changed, nothing else was rebuilt. (A later same-day IA
      // refinement removed the Hero's KPI panel entirely — Category/
      // Condition/Listing Age moved to Command Hub/Quick Specifications or
      // were dropped as redundant with Financial Intelligence's own
      // "Listed" date. The Hero's job is identity only now: property code,
      // status, type — asserted below against what this section actually
      // renders today.)
      const overview = page.locator('#section-overview')
      await expect(overview.getByText('#DVL68660', { exact: true })).toBeVisible()
      await expect(overview.getByText('Under Approval', { exact: true })).toBeVisible()
      await expect(overview.getByText('apartment', { exact: true })).toBeVisible()

      // ── No overflow at the Hero.
      const overviewOverflow = await overview.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(overviewOverflow, `#section-overview horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)

      // ── Banner no longer appears a second time in Asset Management.
      const media = page.locator('#section-media')
      await media.scrollIntoViewIfNeeded()
      await expect(media.getByText('Banner', { exact: true })).toHaveCount(0)

      // ── Legal tab: image-type attachments get a real thumbnail and open
      // in the same Asset Viewer, tagged "Legal" — not "Photos".
      await media.getByRole('tab', { name: /^Legal/ }).click()
      const imageButtons = media.locator('button[aria-label*="image"]')
      await expect(imageButtons.first()).toBeVisible()
      await imageButtons.first().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Legal', { exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    })
  }

  test('a property without a Banner falls back to its main image, unchanged from before this pass', async ({ page, baseURL, request }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await loginViaApi(request, baseURL!)
    const propRes = await request.get(`${baseURL}/api/espo/RealEstateProperty/${NO_BANNER_ID}?select=cBannerphotoId,mainImageId`)
    const { cBannerphotoId, mainImageId } = await propRes.json()
    expect(cBannerphotoId, 'fixture property must have no Banner to test the fallback').toBeFalsy()
    expect(mainImageId, 'fixture property must have a real mainImageId').toBeTruthy()

    await gotoAndAuth(page, baseURL!, NO_BANNER_ID)
    const heroImg = page.locator('#section-overview img').first()
    await expect(heroImg).toBeVisible()
    const heroSrc = await heroImg.getAttribute('src')
    expect(heroSrc).toContain(encodeURIComponent(mainImageId))
  })
})
