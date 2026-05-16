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

// ── Navigation structure with groups ─────────────────────────────────────────

const navGroups = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', href: '/dashboard', icon: LayoutDashboard },
      { id: 'properties', label: 'Properties', href: '/properties', icon: Building2 },
      { id: 'fspo', label: 'FSPO', href: '/fspo', icon: Home },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'request', label: 'Request', href: '/request', icon: ClipboardList },
      { id: 'calls', label: 'Calls', href: '/calls', icon: Phone },
      { id: 'contracts', label: 'Contracts', href: '/contracts', icon: FileText },
      { id: 'contact', label: 'Contact', href: '/contact', icon: Users },
      { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: GitBranch },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    items: [
      { id: 'calendar', label: 'Calendar', href: '/calendar', icon: Calendar },
      { id: 'documents', label: 'Documents', href: '/documents', icon: FolderOpen },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      {
        id: 'company', label: 'Company', href: '/company', icon: Briefcase,
        children: [
          { id: 'company-users', label: 'Users', href: '/company/users', icon: UserSquare2 },
          { id: 'company-teams', label: 'Teams', href: '/company/teams', icon: UsersRound },
        ],
      },
      { id: 'chat', label: 'Chat', href: '/chat', icon: MessageSquare },
      { id: 'email', label: 'Email', href: '/email', icon: Mail },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { width, mobileOpen, dragging, setWidth, snapAfterDrag, setDragging } =
    useSidebarStore()
  const [expanded, setExpanded] = useState(new Set(['company']))
  const dragRef = useRef({ active: false, startX: 0, startW: 0 })

  const isCollapsed = width <= SIDEBAR_MIN
  const showLabels = width > 110

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
          'flex h-14 shrink-0 items-center border-b border-sidebar-border',
          isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-4',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-design-sm">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        {showLabels && (
          <div className="overflow-hidden">
            <p className="whitespace-nowrap text-[13px] font-semibold leading-none text-foreground">
              Ebla CRM
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[10px] leading-none text-muted-foreground">
              Real Estate Suite
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        <div className="flex flex-col gap-3">
          {navGroups.map((group) => (
            <div key={group.id}>
              {/* Group label — only when expanded */}
              {showLabels && (
                <p className="mb-0.5 px-3 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                  {group.label}
                </p>
              )}
              {!showLabels && group.id !== 'main' && (
                <div className="my-1 mx-auto h-px w-5 bg-sidebar-border/60" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const hasChildren = 'children' in item && !!item.children?.length
                  const isActive = pathname === item.href || (!hasChildren && item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                  const isChildActive = hasChildren && item.children!.some((c) => pathname === c.href)
                  const isExpanded = expanded.has(item.id)
                  const highlighted = isActive || isChildActive

                  const iconCls = cn(
                    'h-[17px] w-[17px] shrink-0 stroke-[1.8] transition-colors',
                    highlighted
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )
                  const rowCls = cn(
                    'group flex h-9 items-center rounded-lg transition-colors duration-150 select-none',
                    isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                    highlighted
                      ? 'bg-primary text-primary-foreground shadow-design-xs'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                  )

                  return (
                    <div key={item.id}>
                      {hasChildren && !isCollapsed ? (
                        <div className={cn(rowCls, 'cursor-pointer')} onClick={() => toggleExpand(item.id)}>
                          <item.icon className={iconCls} />
                          {showLabels && (
                            <span className="flex-1 truncate text-[13px] font-medium">{item.label}</span>
                          )}
                          {showLabels && (
                            isExpanded
                              ? <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                              : <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
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
                            <span className="flex-1 truncate text-[13px] font-medium">{item.label}</span>
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
                                  'flex h-8 items-center gap-2 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-150',
                                  childActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                                )}
                              >
                                <child.icon
                                  className={cn(
                                    'h-3.5 w-3.5 shrink-0 stroke-[1.8]',
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
            </div>
          ))}
        </div>
      </nav>

      {/* ── Resize handle ── */}
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
