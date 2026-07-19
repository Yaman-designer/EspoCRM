import { afterEach, vi } from 'vitest'

// Global test setup (wired via vitest.config.ts's test.setupFiles). Resets
// every mock's call history after each test so one test's assertions can
// never leak into the next — every mocked repository/axiosClient/sonner
// call in this suite relies on this instead of repeating its own cleanup.
afterEach(() => {
  vi.clearAllMocks()
})
