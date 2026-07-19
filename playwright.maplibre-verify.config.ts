import { defineConfig, devices } from '@playwright/test'

// Standalone, throwaway config for the MapLibre runtime-verification spec
// only. The project's real playwright.config.ts hard-depends its
// `chromium` project on `setup` (UI-driven login via /login), which failed
// independently of this investigation (the login page redirected back with
// the submitted credentials echoed as URL query params instead of
// completing sign-in — reported separately). This config avoids that
// project dependency entirely since e2e/location-intelligence-map.spec.ts
// authenticates itself directly via the NextAuth Credentials API.
export default defineConfig({
  testDir: './e2e',
  testMatch: /location-intelligence-map\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
