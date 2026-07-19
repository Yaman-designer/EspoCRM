import { vi } from 'vitest'

// Vitest manual mock for the third-party `sonner` toast library — root-level
// __mocks__ is Vitest's documented convention for mocking a node_modules
// package. Activated via `vi.mock('sonner')` with no inline factory.
export const toast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  message: vi.fn(),
}
