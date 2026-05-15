import { StatBar }              from './StatBar'
import { PerformanceChart }     from './PerformanceChart'
import { ActiveListingsTable }  from './ActiveListingsTable'
import { FeaturedPropertyCard } from './FeaturedPropertyCard'
import { DealsProgressBar }     from './DealsProgressBar'
import { LeadsContactList }     from './LeadsContactList'
import { ReminderList }         from './ReminderList'
import { CalendarAgendaPanel }  from './CalendarAgendaPanel'

export function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_300px]">

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-col gap-2">

        <StatBar />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <PerformanceChart />
          <div className="flex flex-col gap-2">
            <FeaturedPropertyCard />
            <DealsProgressBar />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_240px]">
          <ActiveListingsTable />
          <LeadsContactList />
        </div>

      </div>

      {/* ── Right sidebar ── */}
      <div className="flex flex-col gap-2">
        <ReminderList />
        <CalendarAgendaPanel />
      </div>

    </div>
  )
}
