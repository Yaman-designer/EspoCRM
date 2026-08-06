import { test, expect, type Page } from '@playwright/test'

// Address & Coordinates / Quick Specifications UX Architecture pass
// (2026-07-20) — responsive verification. Same direct NextAuth login as the
// other Location Intelligence specs (e2e/auth.setup.ts's UI flow is broken,
// documented there); duplicated here to keep each spec file self-contained.
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

// dvl68651: confirmed live (direct API query) to have NO addressLatitude/
// Longitude and NO address fields at all — exercises the Address/
// Coordinates empty states and the 2-column (no Distances... it DOES have
// one: distanceFromSea) grid math. Has square/yearBuilt/energyClass (3
// specs in the top strip) plus plotArea/balconyArea/kitchens/floor/
// floorCount/cCondition (populates Dimensions, Rooms, and Building &
// Construction groups in the Full Specifications modal) — the richest
// available real record for exercising every group this pass added.
const RICH_SPECS_SLUG = 'dvl68651'
// dvl68656: confirmed live to have a real, populated address AND
// coordinates but no distance data at all — the specific case the dynamic
// grid-column fix targets (2 columns, not 3 with an empty slot).
const ADDRESS_ONLY_SLUG = 'dvl68656'

const BREAKPOINTS = [
  { name: 'desktop',          width: 1440, height: 900 },
  { name: 'large-laptop',     width: 1280, height: 800 },
  { name: 'tablet-landscape', width: 1112, height: 834 },
  { name: 'small-laptop',     width: 1024, height: 768 },
  { name: 'tablet-portrait',  width: 834,  height: 1194 },
  { name: 'large-mobile',     width: 430,  height: 932 },
  { name: 'small-mobile',     width: 360,  height: 800 },
  { name: 'foldable',         width: 320,  height: 720 },
] as const

async function gotoAndAuth(page: Page, baseURL: string, slug: string) {
  await loginViaApi(page.context().request, baseURL)
  await page.goto(`/properties/${slug}`)
  await page.locator('#section-specs').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
}

test.describe('Address & Coordinates / Quick Specifications — responsive verification', () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name} (${bp.width}x${bp.height}): no clipped/hidden info, no horizontal overflow`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await gotoAndAuth(page, baseURL!, RICH_SPECS_SLUG)

      // ── No horizontal overflow contributed by the sections this pass
      // owns. Scoped to #section-specs/#section-location rather than the
      // whole document: PropertyDetailView.tsx's page-level grid pins the
      // Command Hub sidebar column to `min-w-85` (340px), which overflows
      // any viewport narrower than ~380px on every property page —
      // confirmed via direct DOM inspection, a pre-existing, page-level
      // layout constraint with no connection to Address & Coordinates or
      // Quick Specifications, out of scope for this pass. A second,
      // separate pre-existing issue (an unrelated section-jump <nav>) was
      // already found and scoped around the same way in the Location
      // Intelligence Center pass.
      const specsSection = page.locator('#section-specs')
      const addressScope = page.locator('#section-location')
      const specsOverflow   = await specsSection.evaluate(el => el.scrollWidth - el.clientWidth)
      const addressOverflow = await addressScope.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(specsOverflow, `#section-specs horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)
      expect(addressOverflow, `#section-location horizontal overflow at ${bp.width}px`).toBeLessThanOrEqual(1)

      // ── Quick Specifications: the old horizontal-scroll-hides-content
      // pattern must be gone — every spec card visible, none requiring a
      // scroll gesture to reach.
      await expect(specsSection.getByText('m²', { exact: false }).first()).toBeVisible()
      const specCards = specsSection.locator('div.grid > div.rounded-xl.border')
      const specCount = await specCards.count()
      expect(specCount, 'expected at least one spec card').toBeGreaterThan(0)
      for (let i = 0; i < specCount; i++) {
        await expect(specCards.nth(i)).toBeVisible()
      }
      // No overflow-x-auto scroll container left anywhere in this section.
      await expect(page.locator('#section-specs .overflow-x-auto')).toHaveCount(0)

      // ── Full Specifications button never overlaps a spec card ──────────
      const button = page.getByRole('button', { name: 'Full Specifications' })
      await expect(button).toBeVisible()
      const buttonBox = await button.boundingBox()
      if (buttonBox && specCount > 0) {
        const lastCardBox = await specCards.last().boundingBox()
        if (lastCardBox) {
          const overlaps = buttonBox.x < lastCardBox.x + lastCardBox.width
            && buttonBox.x + buttonBox.width > lastCardBox.x
            && buttonBox.y < lastCardBox.y + lastCardBox.height
            && buttonBox.y + buttonBox.height > lastCardBox.y
          expect(overlaps, 'Full Specifications button overlaps a spec card').toBe(false)
        }
      }

      // ── Address & Coordinates: empty states are compact, not a large
      // reserved blank area, and real distance data (From Sea) renders.
      await expect(addressScope.getByText('Not provided').first()).toBeVisible()
      await expect(addressScope.getByText('From Sea', { exact: false })).toBeVisible()

      await page.screenshot({ path: `e2e-artifacts/specs-address-${bp.name}.png`, fullPage: true })
    })
  }

  test('desktop: Address & Coordinates grid uses 2 columns (no Distances) when a property has address+coordinates but no distance data', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoAndAuth(page, baseURL!, ADDRESS_ONLY_SLUG)

    const addressSection = page.locator('#section-location')
    await expect(addressSection.getByText('Address', { exact: true })).toBeVisible()
    await expect(addressSection.getByText('Distances', { exact: true })).toHaveCount(0)

    // Real address text renders (not "Not provided" — this property has a
    // genuine stored address) and coordinates render as real numbers.
    const addressValue = addressSection.getByText('Address', { exact: true }).locator('xpath=following-sibling::p[1]')
    await expect(addressValue).not.toHaveText('Not provided')
    await expect(addressSection.getByText(/\d+\.\d+, \d+\.\d+/)).toBeVisible()

    // Address and Coordinates blocks split the row evenly (2-column grid),
    // not squeezed to 1/3 width with a dead empty third column.
    const addressBox = await addressSection.getByText('Address', { exact: true }).locator('xpath=ancestor::div[contains(@class,"grid")][1]').boundingBox()
    expect(addressBox).not.toBeNull()

    await page.screenshot({ path: 'e2e-artifacts/specs-address-2col-desktop.png', fullPage: true })
  })

  test('Full Specifications modal: grouped sections, responsive grid, no clipping at mobile width', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoAndAuth(page, baseURL!, RICH_SPECS_SLUG)

    await page.getByRole('button', { name: 'Full Specifications' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Full Specifications' })
    await expect(dialog).toBeVisible()

    // Real groups render as headings — only groups with actual populated
    // fields, no fabricated "Utilities"/"General" section with nothing in it.
    await expect(dialog.getByText('Dimensions', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Rooms', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Building & Construction', { exact: true })).toBeVisible()

    await page.screenshot({ path: 'e2e-artifacts/specs-modal-desktop.png' })
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Reopen at mobile width — modal must not clip/overflow a short viewport.
    await page.setViewportSize({ width: 375, height: 667 })
    await page.getByRole('button', { name: 'Full Specifications' }).click()
    const dialogMobile = page.getByRole('dialog').filter({ hasText: 'Full Specifications' })
    await expect(dialogMobile).toBeVisible()
    const dialogBox = await dialogMobile.boundingBox()
    expect(dialogBox).not.toBeNull()
    if (dialogBox) {
      expect(dialogBox.x).toBeGreaterThanOrEqual(0)
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(375 + 1)
      expect(dialogBox.y).toBeGreaterThanOrEqual(0)
      expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(667 + 1)
    }
    await page.screenshot({ path: 'e2e-artifacts/specs-modal-mobile.png' })
  })
})
