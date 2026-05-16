import { StatBar } from './StatBar'
import { PerformanceChartClient } from './PerformanceChartClient'
import { ActiveListingsTable } from './ActiveListingsTable'
import { FeaturedPropertyCard } from './FeaturedPropertyCard'
import { DealsProgressBar } from './DealsProgressBar'
import { LeadsContactList } from './LeadsContactList'
import { ReminderList } from './ReminderList'
import { CalendarAgendaPanel } from './CalendarAgendaPanel'

export function DashboardOverview() {
  return (
    <div className="flex flex-col gap-4">

      {/* ROW 1: TOP STATS */}
      <StatBar />

      {/* ROW 2: MAIN ANALYTICS AREA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Chart (~45% on large screens, meaning 5 or 6 columns. Let's use 5 cols for 41.6%) */}
        <div className="lg:col-span-5 flex flex-col">
          <PerformanceChartClient />
        </div>

        {/* Center: Property + Deals (stacked) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <FeaturedPropertyCard />
          <DealsProgressBar />
        </div>

        {/* Right: Reminder / Follow-ups */}
        <div className="lg:col-span-3 flex flex-col">
          <ReminderList />
        </div>
      </div>

      {/* ROW 3: BOTTOM CONTENT */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Active Listings Table (~55%) */}
        <div className="lg:col-span-5 flex flex-col">
          <ActiveListingsTable />
        </div>

        {/* Center: Leads Contact (~20%) */}
        <div className="lg:col-span-3 flex flex-col">
          <LeadsContactList />
        </div>

        {/* Right: Calendar / Schedule (~25%) */}
        <div className="lg:col-span-4 flex flex-col">
          <CalendarAgendaPanel />
        </div>
      </div>

    </div>
  )
}
