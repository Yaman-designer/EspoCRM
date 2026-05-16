'use client'

/**
 * Client-component boundary for the revenue chart.
 *
 * Why this file exists:
 * ─ Recharts uses ResizeObserver, window, and other browser-only APIs.
 * ─ `ssr: false` is only legal inside a Client Component in App Router.
 * ─ `overview/index.tsx` is a Server Component, so it cannot hold
 *   `dynamic(..., { ssr: false })` directly.
 *
 * Pattern: thin "use client" wrapper → dynamic import lives here → the
 * Server Component above simply imports this wrapper like any other file.
 */

import dynamic from 'next/dynamic'

const Chart = dynamic(
  () => import('./PerformanceChart').then((m) => ({ default: m.PerformanceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex animate-pulse h-full flex-col overflow-hidden rounded-xl bg-card shadow-design-sm">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="space-y-2.5">
            <div className="h-3.5 w-36 rounded-md bg-muted" />
            <div className="mt-2 flex items-end gap-4">
              <div className="h-7 w-20 rounded-md bg-muted" />
              <div className="h-4 w-16 rounded-md bg-muted" />
            </div>
          </div>
          <div className="h-8 w-24 rounded-lg bg-muted" />
        </div>
        <div className="px-2 pb-3 flex-1 min-h-[168px]">
          <div className="h-full w-full rounded-lg bg-muted" />
        </div>
      </div>
    ),
  }
)

export function PerformanceChartClient() {
  return <Chart />
}
