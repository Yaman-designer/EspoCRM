import { test, expect } from '@playwright/test'
import { fillMinimalIdentity, selectFirstOption } from './helpers/wizard'

// Coverage: Maps — LocationMapPreview.tsx's real Leaflet map + AddressSearch.tsx's
// live Nominatim/Google geocoding. Confirmed by static audit to be a genuine
// integration (not a stub); this spec is the first live check of it.
test.describe('Property Wizard — Maps', () => {
  test('the map renders and updates when an address is selected from search', async ({ page }) => {
    await page.goto('/properties/new')
    await fillMinimalIdentity(page, `E2E Map Test ${Date.now()}`)
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()

    // Empty state before any coordinates are known.
    await expect(page.getByText(/search or select region/i)).toBeVisible()

    await page.getByPlaceholder(/search.*address/i).fill('Syntagma Square, Athens')
    await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
    await page.getByRole('option').first().click()

    // A successful address selection populates the canonical address fields
    // and renders the real Leaflet map (not the empty-state placeholder).
    await expect(page.getByLabel('City', { exact: true })).not.toHaveValue('')
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.leaflet-marker-icon')).toBeVisible()
  })

  test('dragging the map marker updates the Latitude/Longitude fields', async ({ page }) => {
    await page.goto('/properties/new')
    await fillMinimalIdentity(page, `E2E Marker Drag Test ${Date.now()}`)
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await selectFirstOption(page, 'Region')

    const latBefore = await page.getByLabel('Latitude', { exact: true }).inputValue()

    const marker = page.locator('.leaflet-marker-icon')
    await marker.waitFor({ state: 'visible', timeout: 10_000 })
    const box = await marker.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40, { steps: 5 })
      await page.mouse.up()
    }

    const latAfter = await page.getByLabel('Latitude', { exact: true }).inputValue()
    expect(latAfter).not.toBe(latBefore)
  })
})
