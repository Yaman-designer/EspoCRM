import type { Metadata } from 'next'
import { DashboardOverview } from '@/components/dashboard/overview'
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return <DashboardOverview />
}
