import type { LucideIcon } from 'lucide-react'

/** A destination in the mobile primary nav. All 4 are equal-weight peers — no overflow/trigger variant. */
export interface BottomNavItemConfig {
  id: string
  href: string
  /** Translation key in the `nav` namespace. */
  labelKey: string
  icon: LucideIcon
}
