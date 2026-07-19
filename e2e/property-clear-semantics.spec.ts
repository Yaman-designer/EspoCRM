import { test, expect } from '@playwright/test'
import { createMinimalProperty, fillText, deletePropertyFromDetailPage } from './helpers/wizard'

// Coverage: Clear Semantics — property-form.transform.ts's applyEditClearSemantics()
// must convert a cleared field's `undefined` into the field's real-empty value
// so a PATCH actually clears it server-side, rather than EspoCRM silently
// keeping the old value. This is the exact gap the engineering audit flagged
// as unverified for cBannerphoto/imagesIds — this spec covers a plain text
// field (Close To), which IS covered by applyEditClearSemantics per the audit.
test.describe('Property Wizard — Clear Semantics', () => {
  test('clearing an optional text field on Edit actually persists as empty, not the old value', async ({ page }) => {
    const { url } = await createMinimalProperty(page, 'E2E Clear Test')

    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await fillText(page, 'Close to', 'Near the metro station')

    // Advance to Review without touching the rest, then submit.
    for (const cta of [
      /Continue to Pricing/, /Continue to Size/, /Continue to Construction/,
      /Continue to Outdoor/, /Continue to Marketing/, /Continue to Review/,
    ]) {
      await page.getByRole('button', { name: cta }).click()
    }
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Property updated')).toBeVisible({ timeout: 15_000 })

    // Re-open Edit and clear the field this time.
    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await expect(page.getByLabel('Close to', { exact: true })).toHaveValue('Near the metro station')
    await page.getByLabel('Close to', { exact: true }).fill('')

    for (const cta of [
      /Continue to Pricing/, /Continue to Size/, /Continue to Construction/,
      /Continue to Outdoor/, /Continue to Marketing/, /Continue to Review/,
    ]) {
      await page.getByRole('button', { name: cta }).click()
    }
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Property updated')).toBeVisible({ timeout: 15_000 })

    // The real test: reload the Edit route from a clean server fetch and
    // confirm the field is genuinely empty, not silently reverted.
    await page.reload()
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await expect(page.getByLabel('Close to', { exact: true })).toHaveValue('')

    await page.goto(url)
    await deletePropertyFromDetailPage(page)
  })
})
