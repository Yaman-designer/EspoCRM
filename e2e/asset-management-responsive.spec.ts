import { test, expect, type Page } from '@playwright/test'

// Asset Management System UX Architecture pass (2026-07-21) — responsive +
// interaction verification. Same direct NextAuth login as the other specs in
// this engagement (e2e/auth.setup.ts's UI flow is broken, documented there).
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

// Primary test property: found via a live search across 200 recent records
// for a property with both 5+ real gallery photos (to exercise the overflow
// "+N Asset Stack" tile) AND at least one real related Document (to exercise
// the Legal tab with genuine data, not just its empty state). No test data
// was fabricated — this is the richest real combination available in this
// dataset for this section.
const PRIMARY_ID = '68d9a39df345c5811'

// Secondary properties for count-adaptive layout edge cases — each is a real
// record found via the same live search, never synthesized.
const ONE_PHOTO_ID = '6a55e8cb1ecd0c61e'   // exactly 1 photo — no empty filler tiles
const ZERO_PHOTO_ID = '6a5a5bd88b90bf9f7'  // 0 photos — graceful empty state

const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'laptop',  width: 1280, height: 1000 },
  { name: 'tablet',  width: 834,  height: 1200 },
  { name: 'mobile',  width: 390,  height: 1400 },
] as const

async function gotoAndAuth(page: Page, baseURL: string, id: string) {
  await loginViaApi(page.context().request, baseURL)
  await page.goto(`/properties/${id}`)
  await page.locator('#section-media').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
}

test.describe('Asset Management System — responsive verification', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): adaptive grid, real tabs, no fabricated captions, no clipping`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await gotoAndAuth(page, baseURL!, PRIMARY_ID)

      const section = page.locator('#section-media')
      await expect(section.getByText('Asset Management System', { exact: true })).toBeVisible()

      // ── Only real, data-backed categories are offered. Floor Plans and
      // Drone were removed after live metadata verification found no field
      // of any kind backing them anywhere in RealEstateProperty (209 fields
      // checked) — confirmed as a product decision, not silently invented.
      await expect(section.getByRole('tab', { name: /^Photos/ })).toBeVisible()
      await expect(section.getByRole('tab', { name: /^Legal/ })).toBeVisible()
      await expect(section.getByRole('tab', { name: /Floor Plans/ })).toHaveCount(0)
      await expect(section.getByRole('tab', { name: /Drone/ })).toHaveCount(0)

      // ── No overflow contributed by this card, scoped to #section-media
      // (never document.documentElement — see the established, documented
      // pre-existing sidebar/nav overflow bugs from earlier phases).
      const overflow = await section.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(overflow, `#section-media horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)

      // ── Real "Primary Photo" badge (mainImageId is a genuine API field,
      // not a UI assumption) and no fabricated per-photo captions. Nothing
      // in EspoCRM's `images` attachmentMultiple carries a caption/tag
      // field, so claiming "Interior View" / "Property View" for an
      // arbitrary gallery slot was a fabricated content claim — removed.
      await expect(section.getByText('Primary Photo', { exact: true })).toBeVisible()
      await expect(section.getByText('Interior View', { exact: true })).toHaveCount(0)
      await expect(section.getByText('Property View', { exact: true })).toHaveCount(0)

      // ── The overflow tile is real (derived count) and functional — the
      // original implementation had zero onClick handlers anywhere in this
      // component, including this tile, which looked like a "view more"
      // control but did nothing.
      const overflowTile = section.getByRole('button', { name: /View all \d+ photos/ })
      await expect(overflowTile).toBeVisible()

      // ── Lightbox opens at the correct index, keyboard nav works, Escape
      // closes, and focus returns explicitly to the tile that opened it —
      // Radix's own default focus-restore was verified (against unmodified,
      // pre-existing code, unrelated to this pass) to silently fail once
      // this section renders; a self-contained explicit restore was added
      // rather than depending on it. See AssetManagementSystem.tsx's
      // lightboxTriggerRef comment for the full investigation.
      await overflowTile.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const counter = dialog.getByText(/^\d+ \/ \d+$/)
      const before = await counter.textContent()
      await page.keyboard.press('ArrowRight')
      await expect(counter).not.toHaveText(before!)
      await page.keyboard.press('ArrowLeft')
      await expect(counter).toHaveText(before!)
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(overflowTile).toBeFocused()

      // ── Legal tab renders real related Document records, not just its
      // empty state — this property has at least one real attached
      // document.
      await section.getByRole('tab', { name: /^Legal/ }).click()
      await expect(section.getByText('No Legal Documents Attached', { exact: true })).toHaveCount(0)
      await expect(section.getByText(/Document/i).first()).toBeVisible()

      await section.getByRole('tab', { name: /^Photos/ }).click()
      await page.screenshot({ path: `e2e-artifacts/asset-management-${bp.name}.png`, fullPage: true })
    })
  }

  test('adaptive grid: a 1-photo property renders one full tile, no empty filler containers', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await gotoAndAuth(page, baseURL!, ONE_PHOTO_ID)
    const section = page.locator('#section-media')
    const panel = section.locator('#asset-tab-panel')
    // Exactly one photo tile — the old fixed-4-slot grid would have shown 3
    // additional grey "no image" filler boxes alongside the real photo.
    await expect(panel.getByRole('button', { name: /open full gallery/ })).toHaveCount(1)
    await expect(section.getByText('Primary Photo', { exact: true })).toBeVisible()
  })

  test('empty state: a 0-photo property shows an elegant empty state, not a broken layout', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await gotoAndAuth(page, baseURL!, ZERO_PHOTO_ID)
    const section = page.locator('#section-media')
    await expect(section.getByText('No Photos Uploaded', { exact: true })).toBeVisible()
    await expect(section.getByRole('tab', { name: /Floor Plans/ })).toHaveCount(0)
    await expect(section.getByRole('tab', { name: /Drone/ })).toHaveCount(0)
  })
})
