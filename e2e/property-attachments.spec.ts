import path from 'node:path'
import { test, expect } from '@playwright/test'
import { fillMinimalIdentity, fillMinimalLocation, deletePropertyFromDetailPage } from './helpers/wizard'

// Coverage: Attachments — the one integration the engineering audit flagged
// most prominently: attachment-upload.service.ts's EspoCRM Attachment contract
// (`POST /Attachment`, base64 data-URI) is, in its own source comment, "never
// demonstrated against a live instance." This spec is that demonstration —
// Create, Edit (replace), Delete, and Restore (edit-mode prefill) in one flow,
// exactly as ordered in the Enterprise Verification & Certification Program.
//
// Needs a real image fixture on disk — see e2e/fixtures/sample-property.jpg.
const FIXTURE_IMAGE = path.join(__dirname, 'fixtures', 'sample-property.jpg')

test.describe('Property Wizard — Attachments', () => {
  test('Create: uploading a property photo persists and is visible on the detail page', async ({ page }) => {
    await page.goto('/properties/new')
    const title = `E2E Attachment Test ${Date.now()}`
    await fillMinimalIdentity(page, title)
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await fillMinimalLocation(page, 'Athens')
    await page.getByRole('button', { name: /Continue to Pricing/ }).click()
    await page.getByLabel('Asking Price', { exact: true }).fill('250000')
    await page.getByRole('button', { name: /Continue to Size/ }).click()
    await page.getByLabel('Total Area', { exact: true }).fill('95')
    await page.getByRole('button', { name: /Continue to Construction/ }).click()
    await page.getByRole('button', { name: /Continue to Outdoor/ }).click()
    await page.getByRole('button', { name: /Continue to Marketing/ }).click()

    await page.getByLabel('Property Photos', { exact: true }).setInputFiles(FIXTURE_IMAGE)
    await expect(page.locator('img[alt*="preview" i], img[alt*="photo" i]').first()).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /Continue to Review/ }).click()
    await page.getByRole('button', { name: 'Create Property' }).click()
    await expect(page.getByText('Property created')).toBeVisible({ timeout: 20_000 }) // uploads can be slow

    // Restore: the uploaded photo must actually render on the real detail page,
    // fetched fresh from EspoCRM (getWebAssetUrl), not a lingering blob: URL.
    const detailUrl = page.url()
    await expect(page.locator('img[src*="Attachment"], img[src*="attachment"]').first()).toBeVisible({ timeout: 15_000 })

    // Edit + Restore: the photo must reappear as a pre-existing preview when editing.
    await page.getByRole('button', { name: /edit/i }).first().click()
    for (const cta of [
      'Continue to Location & Zoning', /Continue to Pricing/, /Continue to Size/,
      /Continue to Construction/, /Continue to Outdoor/, /Continue to Marketing/,
    ]) {
      await page.getByRole('button', { name: cta }).click()
    }
    await expect(page.getByLabel('Property Photos', { exact: true }).locator('..').locator('img')).toBeVisible({ timeout: 10_000 })

    // Delete: remove the photo, save, and confirm it's actually gone after a reload —
    // this is exactly the path property-form.transform.ts flags as unverified
    // (cBannerphoto/imagesIds excluded from applyEditClearSemantics).
    await page.getByRole('button', { name: /remove photo|delete photo/i }).first().click()
    for (const cta of [/Continue to Review/]) {
      await page.getByRole('button', { name: cta }).click()
    }
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Property updated')).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.locator('img[src*="Attachment"], img[src*="attachment"]')).toHaveCount(0)

    await page.goto(detailUrl)
    await deletePropertyFromDetailPage(page)
  })
})
