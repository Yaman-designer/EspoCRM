'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  CheckSquare,
  Calendar,
  Settings,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

const navItems = [
  {
    label: 'لوحة التحكم',
    labelEn: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'جهات الاتصال',
    labelEn: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    label: 'الصفقات',
    labelEn: 'Deals',
    href: '/deals',
    icon: Briefcase,
  },
  {
    label: 'المهام',
    labelEn: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    label: 'التقويم',
    labelEn: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'التقارير',
    labelEn: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
]

const bottomItems = [
  {
    label: 'الإعدادات',
    labelEn: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 start-0 z-50 flex w-[260px] flex-col',
        'bg-sidebar border-e border-sidebar-border',
        'shadow-design-sm',
      )}
    >
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-design-sm">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Ebla CRM</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">Enterprise Edition</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60">
          القائمة الرئيسية
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex h-12 items-center gap-3 rounded-[14px] px-3',
                'text-sm font-medium transition-all duration-250',
                active
                  ? 'bg-primary text-primary-foreground shadow-design-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 stroke-[1.8]',
                  active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        {bottomItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex h-12 items-center gap-3 rounded-[14px] px-3',
                'text-sm font-medium transition-all duration-250',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 stroke-[1.8]',
                  active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Theme toggle + user info */}
        <div className="flex items-center justify-between pt-2 pb-1 px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">AD</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground leading-none">Admin</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">admin@ebla.crm</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  )
}
