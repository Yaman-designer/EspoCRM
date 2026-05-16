// ── Stat cards ───────────────────────────────────────────────────────────────

export type StatColor = 'primary' | 'emerald' | 'amber' | 'teal'

export interface Stat {
  iconName: string
  title: string
  value: string
  trend: string
  up: boolean
  color: StatColor
}

export const stats: Stat[] = [
  { iconName: 'Users',        title: 'Active Leads',    value: '120',    trend: '+8%',  up: true,  color: 'emerald'  },
  { iconName: 'DollarSign',   title: 'Total Revenue',   value: '$96.7M', trend: '+12%', up: true,  color: 'primary'  },
  { iconName: 'Building2',    title: 'Active Listing',  value: '23',     trend: '-4',   up: false, color: 'amber'    },
  { iconName: 'CheckCircle2', title: 'Total Closed',    value: '42',     trend: '+12%', up: true,  color: 'teal'     },
  { iconName: 'Bell',         title: 'Reminder',        value: '15',     trend: '+2',   up: false, color: 'primary'  },
]

// ── Performance chart (values as % of $120M target) ──────────────────────────

export interface ChartPoint {
  month: string
  revenue: number
  visit: number
}

export const chartData: ChartPoint[] = [
  { month: 'Jan', revenue: 38, visit: 60 },
  { month: 'Feb', revenue: 43, visit: 35 },
  { month: 'Mar', revenue: 41, visit: 55 },
  { month: 'Apr', revenue: 51, visit: 40 },
  { month: 'May', revenue: 46, visit: 65 },
  { month: 'Jun', revenue: 81, visit: 70 },
  { month: 'Jul', revenue: 60, visit: 45 },
  { month: 'Aug', revenue: 57, visit: 52 },
]

// ── Active listings ───────────────────────────────────────────────────────────

export type ListingStatus = 'Available' | 'Occupied' | 'Sold Out'

export interface Listing {
  id: number
  title: string
  location: string
  type: string
  units: number
  cost: string
  leadCount: number
  views: number
  status: ListingStatus
  occupancy?: string
}

export const listings: Listing[] = [
  { id: 1, title: 'Maison Sterling', location: 'New York, Albany',  type: 'House',     units: 12,   cost: '$1.5M', leadCount: 32, views: 125, status: 'Occupied',  occupancy: '8/12' },
  { id: 2, title: 'The Orchid',      location: 'Ohio, Columbus',    type: 'Villa',     units: 9300, cost: '$520K', leadCount: 15, views: 930, status: 'Available'                   },
  { id: 3, title: 'Echelon West',    location: 'Ohio, Columbus',    type: 'House',     units: 25,   cost: '$700K', leadCount: 40, views: 355, status: 'Available'                   },
  { id: 4, title: 'La Residence',    location: 'Ohio, Columbus',    type: 'Apartment', units: 17,   cost: '$700K', leadCount: 11, views: 425, status: 'Sold Out'                    },
]

// ── Leads / contacts ──────────────────────────────────────────────────────────

export type LeadTemp = 'hot' | 'warm' | 'cold'

export interface Contact {
  id: number
  initials: string
  name: string
  location: string
  temp: LeadTemp
}

export const contacts: Contact[] = [
  { id: 1, initials: 'JC', name: 'Jessica Chen',  location: 'New York, Albany',  temp: 'hot'  },
  { id: 2, initials: 'JD', name: 'John Doe',       location: 'California, LA',    temp: 'warm' },
  { id: 3, initials: 'HS', name: 'Hailee S.',       location: 'New York, Troy',    temp: 'warm' },
  { id: 4, initials: 'EC', name: 'Evan Chris',      location: 'Ohio, Columbus',    temp: 'cold' },
  { id: 5, initials: 'EP', name: 'Emily Paris',     location: 'California, LA',    temp: 'hot'  },
]

// ── Featured property ─────────────────────────────────────────────────────────

export const featuredProperty = {
  name:         'The Somerset',
  type:         'Luxury Villa',
  location:     'Beverly Hills, CA',
  sold:         175,
  rented:       125,
  views:        '2K+',
  badge:        'Top Performer',
  occupancyPct: 72,
}

// ── Deal pipeline stages ──────────────────────────────────────────────────────

export interface PipelineStage {
  label: string
  count: number
  pct:   number
  color: string
}

export const pipelineStages: PipelineStage[] = [
  { label: 'Prospect',    count: 28, pct: 22, color: 'bg-primary/30'  },
  { label: 'Qualified',   count: 19, pct: 15, color: 'bg-primary/55'  },
  { label: 'Proposal',    count: 15, pct: 12, color: 'bg-primary'     },
  { label: 'Negotiation', count: 9,  pct: 7,  color: 'bg-chart-4'     },
  { label: 'Closed',      count: 42, pct: 44, color: 'bg-chart-3'     },
]

export const dealsProgress = {
  closed:     { label: 'Closed Deals', count: 42  },
  onProgress: { label: 'On Progress',  count: 132 },
}

// ── Activity alerts ───────────────────────────────────────────────────────────

export type AlertLevel = 'urgent' | 'warning' | 'info'

export interface ActivityAlert {
  id:          number
  level:       AlertLevel
  label:       string
  description: string
  avatars:     string[]
  extra:       number
  sparkline:   number[]
  color:       'primary' | 'chart-3' | 'chart-4'
}

export const reminders: ActivityAlert[] = [
  {
    id:          1,
    level:       'warning',
    label:       'Follow-Ups',
    description: '15 leads need to be followed up today',
    avatars:     ['JC', 'JD', 'HS'],
    extra:       11,
    sparkline:   [],
    color:       'primary',
  },
  {
    id:          2,
    level:       'info',
    label:       'Property Visits',
    description: '2 properties and 3 leads scheduled today',
    avatars:     [],
    extra:       0,
    sparkline:   [3, 6, 4, 8, 5, 9, 7, 10, 6, 11],
    color:       'chart-3',
  },
  {
    id:          3,
    level:       'urgent',
    label:       'Expiring Listings',
    description: '2 listings expire in 3 days — action required',
    avatars:     [],
    extra:       0,
    sparkline:   [8, 5, 9, 4, 7, 3, 6, 5, 8, 4],
    color:       'chart-4',
  },
]

// ── Agenda / Schedule ─────────────────────────────────────────────────────────

export type AgendaType = 'visit' | 'followup' | 'meeting'

export interface AgendaItem {
  id:     number
  time:   string
  type:   AgendaType
  name:   string
  detail: string
}

export const agendaItems: AgendaItem[] = [
  { id: 1, time: '9:00 AM',  type: 'visit',    name: 'Visit — Michael Reynolds', detail: '742 Oak Street, Denver, CO 80220'           },
  { id: 2, time: '11:30 AM', type: 'meeting',  name: 'Pipeline Review',          detail: 'Weekly deal review with sales team'         },
  { id: 3, time: '2:00 PM',  type: 'visit',    name: 'Visit — Sarah Thompson',   detail: '1256 Maple Ave, Austin, TX 78704'           },
  { id: 4, time: '4:30 PM',  type: 'followup', name: 'Follow-up — Aaliyah Lovato', detail: '(512) 555-0398 · aaliyah@livento.com'     },
]

export const CALENDAR = {
  year:       2025,
  month:      5,
  today:      2,
  activeDays: [2, 7, 14, 19, 21, 28],
}

export type AgendaTab = 'All' | 'Assigned' | 'My Schedule'
