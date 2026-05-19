// Server-side environment validation.
// ESPO_API_URL is intentionally not NEXT_PUBLIC_ — the URL must never reach the browser.
// All API access goes through the /api/espo proxy route.
const required = ['ESPO_API_URL'] as const

if (typeof window === 'undefined') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `Missing required environment variable: ${key}\n` +
        `See .env.example for the full list of required variables.`,
      )
    }
  }
}

export const env = {
  espoApiUrl: process.env.ESPO_API_URL as string,
} as const
