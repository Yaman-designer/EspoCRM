import { Bell, Search } from 'lucide-react'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md"
    >
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-foreground leading-none">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="بحث سريع..."
            className="h-9 w-56 rounded-xl border border-border bg-muted/50 ps-9 pe-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/12 transition-all duration-250"
          />
        </div>

        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-250 hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-[#F04438] ring-2 ring-background" />
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm select-none cursor-pointer hover:bg-primary/20 transition-colors duration-250">
          AD
        </div>
      </div>
    </header>
  )
}
