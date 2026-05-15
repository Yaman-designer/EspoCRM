import { StatBar }             from './StatBar'
import { PerformanceChart }    from './PerformanceChart'
import { ActiveListingsTable } from './ActiveListingsTable'
import { FeaturedPropertyCard } from './FeaturedPropertyCard'
import { DealsProgressBar }    from './DealsProgressBar'
import { LeadsContactList }    from './LeadsContactList'
import { ReminderList }        from './ReminderList'
import { CalendarWidget }      from './CalendarWidget'
import { AgendaStack }         from './AgendaStack'


export function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-11">

      {/* ── Left + Center zone (8 cols) ── */}
      <div className="flex flex-col gap-2 lg:col-span-8">

        {/* Stat bar — 4 equal cards spanning the 8-col zone */}
        <StatBar />

        {/* Nested 2-column body: analytics (5) | property+contacts (3) */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-8">

          <div className="flex flex-col gap-2 lg:col-span-5">
            <PerformanceChart />
            <ActiveListingsTable />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-3">
            <FeaturedPropertyCard />
            <DealsProgressBar />
            <LeadsContactList />
          </div>

        </div>
      </div>

      {/* ── Right sidebar (3 cols) — full height ── */}
      <div className="flex flex-col gap-2 lg:col-span-3">
        <ReminderList />
        <CalendarWidget />
        <AgendaStack />
      </div>

    </div>
  )
}
