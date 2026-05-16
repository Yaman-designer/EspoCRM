export default function DashboardLoading() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-3 lg:grid-cols-[1fr_272px]">

      {/* ── Main column ── */}
      <div className="flex flex-col gap-3">

        {/* Stat bar skeleton — 4 cells */}
        <div className="overflow-hidden rounded-xl bg-card shadow-design-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-border/50 lg:grid-cols-4 lg:divide-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-muted" />
                  <div className="h-5 w-12 rounded-full bg-muted" />
                </div>
                <div className="h-7 w-20 rounded bg-muted" />
                <div className="mt-1.5 h-3 w-28 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart + side cards row */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_256px]">
          {/* Chart skeleton */}
          <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-design-sm">
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
            <div className="px-2 pb-3">
              <div className="h-[168px] w-full rounded-lg bg-muted" />
            </div>
          </div>

          {/* Right side cards */}
          <div className="flex flex-col gap-3">
            <div className="h-[168px] rounded-xl bg-card shadow-design-sm" />
            <div className="h-[132px] rounded-xl bg-card shadow-design-sm" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-xl bg-card shadow-design-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-36 rounded-lg bg-muted" />
              <div className="h-8 w-28 rounded-lg bg-muted" />
            </div>
          </div>
          <div className="border-b border-border/50 bg-muted/25 px-5 py-2">
            <div className="flex gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 w-16 rounded bg-muted" />
              ))}
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border/40 px-5 py-3 last:border-0"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="hidden h-5 w-20 rounded-full bg-muted sm:block" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
          ))}
          <div className="border-t border-border/50 px-5 py-2.5">
            <div className="h-3 w-40 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* ── Right activity rail ── */}
      <div className="flex flex-col gap-3">
        <div className="h-[196px] rounded-xl bg-card shadow-design-sm" />
        <div className="h-[272px] rounded-xl bg-card shadow-design-sm" />
        <div className="h-[228px] rounded-xl bg-card shadow-design-sm" />
      </div>

    </div>
  )
}
