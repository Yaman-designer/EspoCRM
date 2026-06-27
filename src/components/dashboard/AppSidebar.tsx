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
  UserSquare2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSidebarStore, SIDEBAR_MIN, SIDEBAR_MAX } from '@/store/sidebarStore'

// ── Navigation structure (ids = translation keys in nav namespace) ────────────

interface NavChild {
  id: string
  labelKey: string
  href: string
  icon: LucideIcon
}

interface NavItem {
  id: string
  href: string
  icon: LucideIcon
  children?: NavChild[]
}

interface NavGroup {
  id: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home',       href: '/dashboard',  icon: LayoutDashboard },
      { id: 'properties', href: '/properties', icon: Building2        },
      { id: 'fspo',       href: '/fspo',       icon: Home             },
    ],
  },
  {
    id: 'operations',
    items: [
      { id: 'request',   href: '/request',   icon: ClipboardList },
      { id: 'calls',     href: '/calls',     icon: Phone         },
      { id: 'contracts', href: '/contracts', icon: FileText      },
      { id: 'contact',   href: '/contact',   icon: Users         },
      { id: 'pipeline',  href: '/pipeline',  icon: GitBranch     },
    ],
  },
  {
    id: 'planning',
    items: [
      { id: 'calendar',  href: '/calendar',  icon: Calendar   },
      { id: 'documents', href: '/documents', icon: FolderOpen },
    ],
  },
  {
    id: 'admin',
    items: [
      {
        id: 'company', href: '/company', icon: Briefcase,
        children: [
          { id: 'company-users', labelKey: 'users',  href: '/company/users',  icon: UserSquare2 },
          { id: 'company-teams', labelKey: 'teams', href: '/company/teams', icon: UsersRound  },
        ],
      },
      { id: 'chat',  href: '/chat',  icon: MessageSquare },
      { id: 'email', href: '/email', icon: Mail          },
    ],
  },
]

export function AppSidebar() {
  const { t } = useTranslation('nav')
  const pathname = usePathname()
  const { width, mobileOpen, dragging, setWidth, snapAfterDrag, setDragging } = useSidebarStore()
  const [expanded, setExpanded] = useState(new Set(['company']))
  const dragRef = useRef({ active: false, startX: 0, startW: 0 })

  const isCollapsed = width <= SIDEBAR_MIN
  const showLabels  = width > 110

  const onResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = { active: true, startX: e.clientX, startW: width }
      setDragging(true)

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current.active) return
        const newW = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, dragRef.current.startW + ev.clientX - dragRef.current.startX))
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
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <aside
      data-dragging={dragging || undefined}
      className={cn(
        'app-sidebar fixed inset-y-0 inset-s-0 z-50 flex flex-col overflow-hidden',
        'bg-sidebar border-e border-sidebar-border/20',
        mobileOpen && 'sidebar-mobile-open',
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-[68px] shrink-0 items-center border-b border-sidebar-border/12',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-5',
        )}
      >
        <div className={cn(
          'flex shrink-0 items-center justify-center rounded-[10px]',
          'bg-linear-to-br from-primary to-primary/80',
          'shadow-[0_2px_10px_rgba(0,97,188,0.26),0_1px_2px_rgba(0,97,188,0.16),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.07)]',
          'h-[34px] w-[34px]',
        )}>
          <Building2 className="h-[17px] w-[17px] text-primary-foreground" strokeWidth={1.8} />
        </div>
        {showLabels && (
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-[13px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
              {t('appName')}
            </p>
            <p className="mt-[3px] truncate text-[8.5px] leading-none tracking-[0.16em] text-muted-foreground/52 uppercase">
              {t('appTagline')}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5">
        <div className="flex flex-col gap-[22px]">
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              {showLabels && (
                <p className="mb-[7px] px-3 text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground/46">
                  {t(group.id)}
                </p>
              )}
              {!showLabels && group.id !== 'main' && (
                <div className="my-3 mx-auto h-px w-4 bg-sidebar-border/22" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const hasChildren   = !!item.children?.length
                  const label         = t(item.id)
                  const isActive      = pathname === item.href || (!hasChildren && item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                  const isChildActive = hasChildren && item.children!.some((c) => pathname === c.href)
                  const isExpanded    = expanded.has(item.id)
                  const highlighted   = isActive || isChildActive

                  const iconCls = cn(
                    'h-[15px] w-[15px] shrink-0 stroke-[1.7] transition-colors duration-150 ease-out',
                    highlighted ? 'text-primary' : 'text-muted-foreground/48 group-hover:text-foreground/70',
                  )
                  const rowCls = cn(
                    'group relative flex h-9 items-center rounded-[9px] transition-all duration-150 ease-out select-none',
                    isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-2.5',
                    highlighted
                      ? 'bg-primary/[0.07] text-primary ring-1 ring-inset ring-primary/[0.10] shadow-[0_1px_2px_rgba(0,97,188,0.08)]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/65 hover:text-foreground',
                    highlighted && !isCollapsed && "before:absolute before:content-[''] before:left-0 before:top-[9px] before:bottom-[9px] before:w-[2.5px] before:rounded-full before:bg-primary/80",
                  )

                  return (
                    <div key={item.id}>
                      {hasChildren && !isCollapsed ? (
                        <div className={cn(rowCls, 'cursor-pointer')} onClick={() => toggleExpand(item.id)}>
                          <item.icon className={iconCls} />
                          {showLabels && <span className={cn('flex-1 truncate text-[12.5px] transition-colors duration-150 ease-out', highlighted ? 'font-semibold' : 'font-[450]')}>{label}</span>}
                          {showLabels && (
                            <ChevronRight
                              className={cn(
                                'h-3 w-3 shrink-0 transition-transform duration-200',
                                highlighted ? 'text-primary/55' : 'text-muted-foreground/30',
                                isExpanded && 'rotate-90',
                              )}
                            />
                          )}
                        </div>
                      ) : (
                        <Link href={item.href} className={rowCls} title={isCollapsed ? label : undefined}>
                          <item.icon className={iconCls} />
                          {showLabels && <span className={cn('flex-1 truncate text-[12.5px] transition-colors duration-150 ease-out', highlighted ? 'font-semibold' : 'font-[450]')}>{label}</span>}
                        </Link>
                      )}

                      {/* Submenu — grouped workspace container */}
                      {hasChildren && isExpanded && !isCollapsed && (
                        <div className="mt-1 mx-0.5 rounded-[10px] bg-sidebar-accent/55 p-1.5 space-y-0.5">
                          {item.children!.map((child) => {
                            const childActive = pathname === child.href
                            return (
                              <Link
                                key={child.id}
                                href={child.href}
                                className={cn(
                                  'flex h-[30px] items-center gap-2 rounded-[7px] px-2.5 text-[12px] transition-all duration-150 ease-out',
                                  childActive
                                    ? 'bg-primary/[0.09] text-primary font-semibold ring-1 ring-inset ring-primary/[0.10]'
                                    : 'text-sidebar-foreground/80 font-[450] hover:bg-sidebar-accent hover:text-foreground',
                                )}
                              >
                                <child.icon
                                  className={cn(
                                    'h-3.5 w-3.5 shrink-0 stroke-[1.7] transition-colors duration-150 ease-out',
                                    childActive ? 'text-primary' : 'text-muted-foreground/40',
                                  )}
                                />
                                <span>{t(child.labelKey)}</span>
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
            'absolute inset-y-0 inset-e-0 w-0.5 origin-right scale-x-0 rounded-full bg-primary/35',
            'transition-transform duration-150 group-hover:scale-x-100',
            dragging && 'scale-x-100 bg-primary/55',
          )}
        />
      </div>
    </aside>
  )
}
