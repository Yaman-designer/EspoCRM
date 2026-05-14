import type { Metadata } from 'next'
import {
  Building2,
  TrendingUp,
  Users,
  PhoneCall,
  FileSignature,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { RevenueChart } from '@/components/dashboard/charts/RevenueChart'
import { DealsChart } from '@/components/dashboard/charts/DealsChart'

export const metadata: Metadata = { title: 'Dashboard' }

const kpis = [
  {
    label: 'Total Properties',
    value: '1,284',
    change: '+12%',
    up: true,
    icon: Building2,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Active Listings',
    value: '347',
    change: '+8%',
    up: true,
    icon: TrendingUp,
    color: 'text-[#12B76A]',
    bg: 'bg-[#12B76A]/10',
  },
  {
    label: 'New Contacts',
    value: '89',
    change: '-3%',
    up: false,
    icon: Users,
    color: 'text-[#F79009]',
    bg: 'bg-[#F79009]/10',
  },
  {
    label: 'Calls This Week',
    value: '214',
    change: '+22%',
    up: true,
    icon: PhoneCall,
    color: 'text-[#7BBFFF]',
    bg: 'bg-[#7BBFFF]/10',
  },
  {
    label: 'Contracts Signed',
    value: '38',
    change: '+5%',
    up: true,
    icon: FileSignature,
    color: 'text-[#12B76A]',
    bg: 'bg-[#12B76A]/10',
  },
  {
    label: 'Revenue (YTD)',
    value: '$847K',
    change: '+18%',
    up: true,
    icon: DollarSign,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

const recentListings = [
  { id: 'P-1041', address: '12 Corniche Rd, Abu Dhabi', type: 'Villa', price: '$1,200,000', status: 'Active', agent: 'Sara Al Maktoum' },
  { id: 'P-1040', address: '5 Marina Walk, Dubai', type: 'Apartment', price: '$620,000', status: 'Pending', agent: 'Ahmed Khalid' },
  { id: 'P-1039', address: '88 Palm Crescent, Sharjah', type: 'Townhouse', price: '$480,000', status: 'Sold', agent: 'Layla Hassan' },
  { id: 'P-1038', address: '30 Al Wasl Blvd, Dubai', type: 'Office', price: '$950,000', status: 'Active', agent: 'Omar Faisal' },
  { id: 'P-1037', address: '7 Heritage District, Al Ain', type: 'Villa', price: '$780,000', status: 'Sold', agent: 'Sara Al Maktoum' },
]

const statusColors: Record<string, string> = {
  Active: 'bg-[#12B76A]/10 text-[#12B76A]',
  Pending: 'bg-[#F79009]/10 text-[#F79009]',
  Sold: 'bg-primary/10 text-primary',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-4 shadow-design-xs flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
              </span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                  kpi.up ? 'text-[#12B76A]' : 'text-destructive'
                }`}
              >
                {kpi.up ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {kpi.change}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{kpi.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart – spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-design-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Revenue Overview</p>
              <p className="text-xs text-muted-foreground mt-0.5">Actual vs Target (Jan – Jul)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-[#1A90FF] inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-[#12B76A] inline-block" />
                Target
              </span>
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Pipeline donut */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-design-xs">
          <p className="mb-1 text-sm font-semibold text-foreground">Pipeline</p>
          <p className="mb-4 text-xs text-muted-foreground">Deal stages distribution</p>
          <DealsChart />
        </div>
      </div>

      {/* Recent Listings */}
      <div className="rounded-xl border border-border bg-card shadow-design-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Recent Listings</p>
          <a href="/properties" className="text-xs font-medium text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['ID', 'Address', 'Type', 'Price', 'Status', 'Agent'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-start text-[11px] font-semibold uppercase tracking-[0.6px] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentListings.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{row.id}</td>
                  <td className="px-5 py-3.5 text-foreground font-medium max-w-[200px] truncate">{row.address}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row.type}</td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{row.price}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row.agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
