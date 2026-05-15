'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CALENDAR, agendaItems } from './data'

// ── Calendar helpers ──────────────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const TABS = ['All', 'Assigned', 'My Schedule'] as const

function buildGrid(year: number, month: number): (number | null)[] {
  const rawDay      = new Date(year, month, 1).getDay()
  const firstCol    = (rawDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstCol).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ── Combined panel ────────────────────────────────────────────────────────────

export function CalendarAgendaPanel() {
  const { year, month, today, activeDays } = CALENDAR
  const cells = buildGrid(year, month)

  return (
    <Card className="gap-0 p-0">

      {/* ── Calendar section ── */}
      <div className="p-4">

        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon-xs" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold text-foreground">
            {MONTH_NAMES[month]} {year}
          </p>
          <Button variant="ghost" size="icon-xs" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="h-8" />
            const isToday  = day === today
            const isActive = activeDays.includes(day)
            return (
              <button
                key={day}
                className={cn(
                  'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isToday  && 'bg-primary text-primary-foreground shadow-design-sm',
                  !isToday && isActive  && 'bg-primary/10 font-semibold text-primary',
                  !isToday && !isActive && 'text-foreground hover:bg-muted',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* ── Agenda section ── */}
      <div className="p-4">
        <Tabs defaultValue="All">
          <TabsList
            className={cn(
              'mb-3 h-auto w-full justify-start gap-0',
              'rounded-none border-b border-border bg-transparent p-0',
            )}
          >
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  'h-auto rounded-none border-0 bg-transparent px-3 pb-2.5 pt-0',
                  'text-xs font-medium shadow-none',
                  /* active indicator — thin primary underline */
                  'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5',
                  'after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity',
                  'data-[state=active]:bg-transparent data-[state=active]:text-primary',
                  'data-[state=active]:shadow-none data-[state=active]:after:opacity-100',
                )}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="flex flex-col gap-2">
                {agendaItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted/70"
                  >
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

    </Card>
  )
}
