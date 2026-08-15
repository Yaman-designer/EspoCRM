import { LayoutDashboard, Building2, Calendar, MessageSquare } from 'lucide-react'
import type { BottomNavItemConfig } from './bottom-nav.types'

/**
 * Mobile primary navigation — exactly 4 fixed peers, deliberately not a
 * windowed subset of AppSidebar's full tree (no overflow trigger). The
 * indicator capsule is a pure `100 / BOTTOM_NAV_ITEMS.length`% CSS split, so
 * this length must stay in sync with BottomNav.tsx's assumption of 4 equal
 * segments — changing the count is fine, changing it to *unequal* items
 * is not, without also reworking the indicator's width math.
 *
 * "Meetings" reuses AppSidebar's own /calendar route under a mobile-specific
 * label — this CRM has no separate meetings entity, and a real-estate
 * calendar is overwhelmingly viewing/meeting appointments, so the same
 * destination is relabeled rather than left as the more generic "Calendar".
 */
export const BOTTOM_NAV_ITEMS: BottomNavItemConfig[] = [
  { id: 'home',       href: '/dashboard',  labelKey: 'home',       icon: LayoutDashboard },
  { id: 'properties', href: '/properties', labelKey: 'properties', icon: Building2        },
  { id: 'meetings',   href: '/calendar',   labelKey: 'meetings',   icon: Calendar         },
  { id: 'chat',       href: '/chat',       labelKey: 'chat',       icon: MessageSquare    },
]
