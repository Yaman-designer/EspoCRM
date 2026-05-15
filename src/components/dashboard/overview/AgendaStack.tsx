'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { agendaItems, type AgendaItem, type AgendaTab } from './data'

const TABS: AgendaTab[] = ['All', 'Assigned', 'My Schedule']

function AgendaCard({ item }: { item: AgendaItem }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted/70">
      <p className="text-sm font-medium text-foreground">{item.name}</p>
      <p className="text-[11px] text-muted-foreground">{item.detail}</p>
    </div>
  )
}

export function AgendaStack() {
  const [activeTab, setActiveTab] = useState<AgendaTab>('All')

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-design-sm">

      {/* Tabs */}
      <div className="mb-4 flex gap-0 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-2.5 pr-4 text-xs font-medium transition-colors',
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2.5">
        {agendaItems.map((item) => (
          <AgendaCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
