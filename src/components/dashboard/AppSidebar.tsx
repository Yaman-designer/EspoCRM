'use client'

import { useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Home,
  ClipboardList,
  Phone,
  FileText,
  Users,
  GitBranch,
  Calendar,
  Briefcase,
  FolderOpen,
  MessageSquare,
  Mail,
  ChevronRight,
  ChevronDown,
  UserSquare2,
  UsersRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useSidebarStore,
  SIDEBAR_MIN,
  SIDEBAR_MAX,
} from '@/store/sidebarStore'

const navItems = [
  { id: 'home',       label: 'Home',       href: '/dashboard',    icon: LayoutDashboard },
  { id: 'properties', label: 'Properties', href: '/properties',   icon: Building2 },
  { id: 'fspo',       label: 'FSPO',       href: '/fspo',         icon: Home },
  { id: 'request',    label: 'Request',    href: '/request',      icon: ClipboardList },
  { id: 'calls',      label: 'Calls',      href: '/calls',        icon: Phone },
  { id: 'contracts',  label: 'Contracts',  href: '/contracts',    icon: FileText },
  { id: 'contact',    label: 'Contact',    href: '/contact',      icon: Users },
  { id: 'pipeline',   label: 'Pipeline',   href: '/pipeline',     icon: GitBranch },
  { id: 'calendar',   label: 'Calendar',   href: '/calendar',     icon: Calendar },
  {
    id: 'company', label: 'Company', href: '/company', icon: Briefcase,
    children: [
      { id: 'company-users', label: 'Users', href: '/company/users', icon: UserSquare2 },
      { id: 'company-teams', label: 'Teams', href: '/company/teams', icon: UsersRound },
    ],
  },
  { id: 'documents',  label: 'Documents',  href: '/documents',    icon: FolderOpen },
  { id: 'chat',       label: 'Chat',       href: '/chat',         icon: MessageSquare },
  { id: 'email',      label: 'Email',      href: '/email',        icon: Mail },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { width, mobileOpen, dragging, setWidth, snapAfterDrag, setDragging } =
    useSidebarStore()
  const [expanded, setExpanded] = useState(new Set(['company']))
  const dragRef = useRef({ active: false, startX: 0, startW: 0 })

  const isCollapsed = width <= SIDEBAR_MIN
  const showLabels  = width > 110

  /* ── Resize drag (desktop only — CSS hides handle on mobile) ── */
  const onResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = { active: true, startX: e.clientX, startW: width }
      setDragging(true)

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current.active) return
        const newW = Math.max(
          SIDEBAR_MIN,
          Math.min(SIDEBAR_MAX, dragRef.current.startW + ev.clientX - dragRef.current.startX),
        )
        /* Update CSS variable immediately — no re-render lag during drag */
        document.documentElement.style.setProperty('--sidebar-w', `${newW}px`)
        setWidth(newW)
      }

      const onUp = () => {
        dragRef.current.active = false
        snapAfterDrag()
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [width, setWidth, setDragging, snapAfterDrag],
  )

  const toggleExpand = (id: string) => {
    if (isCollapsed) return
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    /*
     * "app-sidebar" is styled in globals.css:
     *   – mobile: transform: translateX(-110%) by default
     *   – "sidebar-mobile-open": transform: translateX(0)
     *   – @media md: transform: none !important  (always visible)
     *   – width comes from CSS variable --sidebar-w (set by DashboardShell)
     * data-dragging disables CSS transitions during active drag.
     */
    <aside
      data-dragging={dragging || undefined}
      className={cn(
        'app-sidebar fixed inset-y-0 inset-s-0 z-50 flex flex-col',
        'bg-sidebar border-e border-sidebar-border shadow-design-sm',
        mobileOpen && 'sidebar-mobile-open',
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-[72px] shrink-0 items-center border-b border-sidebar-border',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-5',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-design-sm">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        {showLabels && (
          <div className="overflow-hidden">
            <p className="whitespace-nowrap text-sm font-semibold leading-none text-foreground">
              Ebla CRM
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] leading-none text-muted-foreground">
              Real Estate Suite
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60">
            Navigation
          </p>
        )}

        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            const isChildActive = item.children?.some((c) => pathname === c.href) ?? false
            const hasChildren   = !!item.children?.length
            const isExpanded    = expanded.has(item.id)
            const highlighted   = isActive || isChildActive

            const iconCls = cn(
              'h-[18px] w-[18px] shrink-0 stroke-[1.8] transition-colors',
              highlighted
                ? 'text-primary-foreground'
                : 'text-muted-foreground group-hover:text-foreground',
            )
            const rowCls = cn(
              'group flex h-11 items-center rounded-lg transition-colors duration-150 select-none',
              isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
              highlighted
                ? 'bg-primary text-primary-foreground shadow-design-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
            )

            return (
              <div key={item.id}>
                {hasChildren && !isCollapsed ? (
                  <div className={cn(rowCls, 'cursor-pointer')} onClick={() => toggleExpand(item.id)}>
                    <item.icon className={iconCls} />
                    {showLabels && (
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                    )}
                    {showLabels && (
                      isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={rowCls}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={iconCls} />
                    {showLabels && (
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                    )}
                    {showLabels && isActive && !hasChildren && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isExpanded && !isCollapsed && (
                  <div className="ms-5 mt-0.5 space-y-0.5 border-s border-sidebar-border ps-3">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={cn(
                            'flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors duration-150',
                            childActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                          )}
                        >
                          <child.icon
                            className={cn(
                              'h-4 w-4 shrink-0 stroke-[1.8]',
                              childActive ? 'text-primary' : 'text-muted-foreground',
                            )}
                          />
                          <span>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── Bottom user info ── */}
      <div
        className={cn(
          'shrink-0 border-t border-sidebar-border py-3',
          isCollapsed ? 'flex justify-center' : 'px-4',
        )}
      >
        {isCollapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xs font-semibold text-primary">AD</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-semibold text-primary">AD</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium leading-none text-foreground">Admin User</p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">admin@ebla.crm</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Resize handle (hidden on mobile via CSS) ── */}
      <div
        onMouseDown={onResizeDown}
        className="absolute inset-y-0 inset-e-0 z-10 hidden w-2 cursor-col-resize group md:block"
        aria-hidden
      >
        <div
          className={cn(
            'absolute inset-y-0 inset-e-0 w-0.5 origin-right scale-x-0 rounded-full bg-primary/40',
            'transition-transform duration-150 group-hover:scale-x-100',
            dragging && 'scale-x-100 bg-primary/60',
          )}
        />
      </div>
    </aside>
  )
}
