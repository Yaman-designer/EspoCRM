import { AppSidebar } from '@/components/dashboard/AppSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {/* Main content — offset by sidebar width */}
      <div className="ms-[260px] flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  )
}
