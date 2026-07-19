import { test as setup, expect } from '@playwright/test'

// Logs in once via the real Credentials provider (src/lib/auth.ts -> EspoCRM
// /App/user) and persists the resulting session so every spec project can
// reuse it via `storageState` instead of re-authenticating per test.
//
// Deliberately reads credentials from the environment only — never hardcode
// or guess a username/password here.
const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD

  if (!username || !password) {
    throw new Error(
      'E2E_USERNAME / E2E_PASSWORD are not set. This suite drives a real EspoCRM ' +
      'staging login (see ESPO_API_URL in .env.local) — provide a real, ' +
      'authorized test account via the environment before running it.',
    )
  }

  await page.goto('/login')
  await page.getByLabel('Username', { exact: true }).fill(username)
  // PasswordField.tsx previously wrapped its <Input> in an extra <div> (for
  // the show/hide toggle button) inside shadcn's FormControl's Slot, which
  // forwards id/aria-* to its single immediate child — landing them on the
  // div instead of the input and breaking the label's htmlFor association
  // (getByLabel('Password') found nothing, confirmed live 2026-07-14, Wave 1
  // first run). Fixed by moving FormControl to wrap only the <Input>
  // (Enterprise Certification Program, 2026-07-16) — re-verified locally
  // against a running dev server (no staging credentials needed for this
  // check) before removing this workaround.
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // A successful login redirects out of /login into the dashboard shell.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
