import dynamic from 'next/dynamic'

// ── Skeleton primitives ──────────────────────────────────────────────────────
// Inline so they render immediately on the server without any extra imports.

function StatBarSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-design-sm animate-pulse">
      <div className="grid grid-cols-2 divide-x divide-y divide-border/50 lg:grid-cols-5 lg:divide-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="h-5 w-12 rounded-full bg-muted" />
            </div>
            <div className="mt-2 h-3 w-20 rounded bg-muted" />
            <div className="mt-2 h-7 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CardSkeleton({ h = 'h-full min-h-[200px]' }: { h?: string }) {
  return (
    <div
      className={`${h} animate-pulse overflow-hidden rounded-xl bg-card shadow-design-sm`}
    />
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-design-sm animate-pulse">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-36 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
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
    </div>
  )
}

// ── Dynamic imports ───────────────────────────────────────────────────────────
// Each widget gets its own JS chunk.
// `ssr: true` (default) keeps server-rendered HTML for non-chart widgets so
// Googlebot sees content even without JS.

const StatBar = dynamic(
  () => import('./StatBar').then((m) => ({ default: m.StatBar })),
  { loading: StatBarSkeleton },
)

const PerformanceChartClient = dynamic(
  () => import('./PerformanceChartClient').then((m) => ({ default: m.PerformanceChartClient })),
  { loading: () => <CardSkeleton h="h-full min-h-[240px]" /> },
)

const FeaturedPropertyCard = dynamic(
  () => import('./FeaturedPropertyCard').then((m) => ({ default: m.FeaturedPropertyCard })),
  { loading: () => <CardSkeleton h="h-full min-h-[160px]" /> },
)

const DealsProgressBar = dynamic(
  () => import('./DealsProgressBar').then((m) => ({ default: m.DealsProgressBar })),
  { loading: () => <CardSkeleton h="h-[96px]" /> },
)

const ReminderList = dynamic(
  () => import('./ReminderList').then((m) => ({ default: m.ReminderList })),
  { loading: () => <CardSkeleton h="h-full min-h-[200px]" /> },
)

const ActiveListingsTable = dynamic(
  () => import('./ActiveListingsTable').then((m) => ({ default: m.ActiveListingsTable })),
  { loading: TableSkeleton },
)

const LeadsContactList = dynamic(
  () => import('./LeadsContactList').then((m) => ({ default: m.LeadsContactList })),
  { loading: () => <CardSkeleton h="h-full min-h-[240px]" /> },
)

const CalendarAgendaPanel = dynamic(
  () => import('./CalendarAgendaPanel').then((m) => ({ default: m.CalendarAgendaPanel })),
  { loading: () => <CardSkeleton h="h-full min-h-[280px]" /> },
)

// ── Layout ────────────────────────────────────────────────────────────────────

export function DashboardOverview() {
  return (
    <div className="flex flex-col gap-4">

      {/* ROW 1: TOP STATS */}
      <StatBar />

      {/* ROW 2: MAIN ANALYTICS AREA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col">
          <PerformanceChartClient />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <FeaturedPropertyCard />
          <DealsProgressBar />
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <ReminderList />
        </div>
      </div>

      {/* ROW 3: BOTTOM CONTENT */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col">
          <ActiveListingsTable />
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <LeadsContactList />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <CalendarAgendaPanel />
        </div>
      </div>

    </div>
  )
}
