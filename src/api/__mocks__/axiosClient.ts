import { vi } from 'vitest'

// Vitest manual mock (https://vitest.dev/guide/mocking.html#modules) — every
// repository test activates this with a single `vi.mock('@/api/axiosClient')`
// and no inline factory, so the mock shape lives in exactly one place
// instead of being re-declared per test file.
const axiosClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

export default axiosClient
