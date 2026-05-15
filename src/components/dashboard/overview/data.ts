// ── Stat cards ───────────────────────────────────────────────────────────────

export interface Stat {
  emoji: string
  title: string
  value: string
  trend: string
  up: boolean
}

export const stats: Stat[] = [
  { emoji: '🧑',  title: 'Active Leads',   value: '120',    trend: '+12%', up: true  },
  { emoji: '💰',  title: 'Total Revenue',  value: '$96.7M', trend: '+12%', up: true  },
  { emoji: '🏠',  title: 'Active Listing', value: '23',     trend: '-12%', up: false },
  { emoji: '✅',  title: 'Total Closed',   value: '42',     trend: '+12%', up: true  },
]

// ── Performance chart (values as % of $120M target) ──────────────────────────

export interface ChartPoint {
  month: string
  revenue: number // % of target
  visit: number   // % scale
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
  occupancy?: string   // e.g. "8/12" when partially occupied
}

export const listings: Listing[] = [
  { id: 1, title: 'Maison Sterling', location: 'New York, Albany',   type: 'House',     units: 12,   cost: '$1.5M', leadCount: 32, views: 125, status: 'Occupied',  occupancy: '8/12' },
  { id: 2, title: 'The Orchid',      location: 'Ohio, Columbus',     type: 'Villa',     units: 9300, cost: '$520K', leadCount: 15, views: 930, status: 'Available'                   },
  { id: 3, title: 'Echelon West',    location: 'Ohio, Columbus',     type: 'House',     units: 25,   cost: '$700K', leadCount: 40, views: 355, status: 'Available'                   },
  { id: 4, title: 'La Residence',    location: 'Ohio, Columbus',     type: 'Apartment', units: 17,   cost: '$700K', leadCount: 11, views: 425, status: 'Sold Out'                    },
]

// ── Leads / contacts ──────────────────────────────────────────────────────────

export interface Contact {
  id: number
  initials: string
  name: string
  location: string
}

export const contacts: Contact[] = [
  { id: 1, initials: 'JC', name: 'Jessica Chen',  location: 'New York, Albany'   },
  { id: 2, initials: 'JD', name: 'John Doe',       location: 'California, LA'     },
  { id: 3, initials: 'HS', name: 'Hailee S.',       location: 'New York, Troy'     },
  { id: 4, initials: 'EC', name: 'Evan Chris',      location: 'Ohio, Columbus'     },
  { id: 5, initials: 'EP', name: 'Emily Paris',     location: 'California, LA'     },
]

// ── Featured property ─────────────────────────────────────────────────────────

export const featuredProperty = {
  name:   'The Somerset',
  type:   'House',
  sold:   175,
  rented: 125,
  views:  '2K+',
  badge:  'Popular Property',
}

// ── Deals overview ────────────────────────────────────────────────────────────

export const dealsProgress = {
  closed:     { label: 'Closed Deals', count: 42  },
  onProgress: { label: 'On Progress',  count: 132 },
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export interface Reminder {
  id:          number
  label:       string
  description: string
  avatars:     string[]
  extra:       number
  /** Mini-chart values; empty when row shows an avatar stack instead */
  sparkline:   number[]
  color:       'primary' | 'chart-3' | 'chart-4'
}

export const reminders: Reminder[] = [
  {
    id:          1,
    label:       'Follow-Ups',
    description: '15 leads need to be followed up',
    avatars:     ['JC', 'JD', 'HS'],
    extra:       11,
    sparkline:   [],
    color:       'primary',
  },
  {
    id:          2,
    label:       'Visits',
    description: '2 Properties and 3 Leads visit today',
    avatars:     [],
    extra:       0,
    sparkline:   [3, 6, 4, 8, 5, 9, 7, 10, 6, 11],
    color:       'chart-3',
  },
  {
    id:          3,
    label:       'Expire Listings',
    description: '2 Listings are about to expire in 3 days',
    avatars:     [],
    extra:       0,
    sparkline:   [8, 5, 9, 4, 7, 3, 6, 5, 8, 4],
    color:       'chart-4',
  },
]

// ── Calendar ──────────────────────────────────────────────────────────────────

export const CALENDAR = {
  year:       2025,
  month:      5,    // June (0-indexed)
  today:      2,
  activeDays: [2, 7, 14, 19, 21, 28],
}

// ── Agenda ────────────────────────────────────────────────────────────────────

export type AgendaTab = 'All' | 'Assigned' | 'My Schedule'

export interface AgendaItem {
  id: number
  name: string
  detail: string
}

export const agendaItems: AgendaItem[] = [
  { id: 1, name: 'Visit Client Michael Reynolds', detail: '742 Oak Street, Denver, CO 80220'               },
  { id: 2, name: 'Visit Client Sarah Thompson',   detail: '1256 Maple Ave, Austin, TX 78704'               },
  { id: 3, name: 'Follow Up  Aaliyah Lovato',     detail: 'aaliyah123@livento.com  |  (512) 555-0398'      },
]
