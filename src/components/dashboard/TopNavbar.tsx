'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { logoutAction } from '@/actions/auth'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { useLanguageStore, languageLabels, type Language } from '@/store/languageStore'
import { useSidebarStore } from '@/store/sidebarStore'
import {
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Globe,
  Check,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Shared icon-button class ── */
const btnCls = cn(
  'flex h-10 w-10 items-center justify-center rounded-xl border border-border',
  'bg-background text-muted-foreground transition-all duration-200',
  'hover:bg-muted hover:text-foreground',
)

const notifications = [
  { id: 1, title: 'New property listing added', time: '2 min ago', unread: true },
  { id: 2, title: 'Contract #1042 signed',       time: '1 hr ago',  unread: true },
  { id: 3, title: 'Call scheduled with client',  time: '3 hrs ago', unread: false },
]

export function TopNavbar() {
  const { data: session } = useSession()
  const { language, setLanguage } = useLanguageStore()
  const { width, mobileOpen, toggle, setMobileOpen } = useSidebarStore()

  const [langOpen,    setLangOpen]    = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const closeAll = () => { setLangOpen(false); setNotifOpen(false); setProfileOpen(false) }

  /* Auto-focus search input when it opens on mobile */
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const userName    = session?.user?.name ?? 'User'
  const initials    = userName.slice(0, 2).toUpperCase()
  const unreadCount = notifications.filter((n) => n.unread).length
  const isCollapsed = width <= 64

  /* Decide desktop vs mobile purely from current viewport — no state needed */
  function handleSidebarToggle() {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileOpen(!mobileOpen)
    } else {
      toggle()
    }
  }

  /* ── Sidebar toggle ── */
  function SidebarToggle() {
    return (
      <button
        onClick={handleSidebarToggle}
        className={btnCls}
        aria-label="Toggle sidebar"
      >
        {/* Mobile icons — hidden on desktop */}
        {mobileOpen
          ? <X          className="h-4 w-4 md:hidden" />
          : <Menu       className="h-4 w-4 md:hidden" />}
        {/* Desktop icons — hidden on mobile */}
        {isCollapsed
          ? <PanelLeft      className="h-4 w-4 hidden md:block" />
          : <PanelLeftClose className="h-4 w-4 hidden md:block" />}
      </button>
    )
  }

  /* ── Language dropdown ── */
  function LangDropdown() {
    return (
      <div className="relative">
        <button
          onClick={() => { closeAll(); setLangOpen((p) => !p) }}
          className={cn(btnCls, langOpen && 'bg-muted text-foreground')}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
        </button>

        {langOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
            <div className="absolute inset-e-0 top-[calc(100%+8px)] z-20 min-w-[160px] rounded-xl border border-border bg-popover py-1 shadow-design-md">
              {(Object.entries(languageLabels) as [Language, { label: string; flag: string }][]).map(
                ([code, meta]) => (
                  <button
                    key={code}
                    onClick={() => { setLanguage(code); setLangOpen(false) }}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted',
                      language === code ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    <span className="text-lg leading-none">{meta.flag}</span>
                    <span className="flex-1 text-start font-medium">{meta.label}</span>
                    {language === code && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                ),
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  /* ── Notifications dropdown ── */
  function NotifDropdown() {
    return (
      <div className="relative">
        <button
          onClick={() => { closeAll(); setNotifOpen((p) => !p) }}
          aria-label="Notifications"
          className={cn('relative', btnCls, notifOpen && 'bg-muted text-foreground')}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 inset-e-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-[9px] font-bold leading-none text-white ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
            <div className="absolute inset-e-0 top-[calc(100%+8px)] z-20 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-design-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                      n.unread && 'bg-accent/20',
                    )}
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.unread ? 'bg-primary' : 'bg-transparent')} />
                    <div>
                      <p className="text-sm leading-snug text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <button className="text-xs font-medium text-primary hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  /* ── Profile dropdown ── */
  function ProfileDropdown() {
    return (
      <div className="relative">
        <button
          onClick={() => { closeAll(); setProfileOpen((p) => !p) }}
          className={cn(
            'flex h-10 items-center gap-2 rounded-xl border border-border px-2.5',
            'bg-background text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted',
            profileOpen && 'bg-muted',
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          {/* Name visible on desktop only */}
          <span className="hidden max-w-[120px] truncate md:block">{userName}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', profileOpen && 'rotate-180')} />
        </button>

        {profileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
            <div className="absolute inset-e-0 top-[calc(100%+8px)] z-20 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-design-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {session?.user?.email ?? ''}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile
                </Link>
              </div>

              <div className="border-t border-border py-1">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[72px] items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md md:gap-3 md:px-6">

        {/* Sidebar toggle */}
        <SidebarToggle />

        {/* Search bar — desktop only */}
        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Type here to search..."
            className={cn(
              'h-10 w-full max-w-sm rounded-xl border border-border bg-muted/50',
              'ps-9 pe-20 text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none transition-all duration-200 focus:border-ring focus:ring-4 focus:ring-ring/12',
            )}
          />
          <div className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2">
            <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-[11px]">⌘</span>F
            </kbd>
          </div>
        </div>

        {/* Spacer — pushes right group to end on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right action group — always visible on all screens */}
        <div className="flex items-center gap-1">

          {/* Search icon — mobile only */}
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className={cn(btnCls, 'md:hidden', searchOpen && 'bg-muted text-foreground')}
            aria-label={searchOpen ? 'Close search' : 'Search'}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          <ThemeSwitcher />
          <LangDropdown />
          <NotifDropdown />
          <ProfileDropdown />
        </div>
      </header>

      {/* Mobile expandable search bar — slides in below header */}
      {searchOpen && (
        <div className="sticky top-[72px] z-30 border-b border-border bg-background px-4 py-3 shadow-design-sm md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Type here to search..."
              className={cn(
                'h-10 w-full rounded-xl border border-border bg-muted/50',
                'ps-9 pe-4 text-sm text-foreground placeholder:text-muted-foreground',
                'outline-none transition-all duration-200 focus:border-ring focus:ring-4 focus:ring-ring/12',
              )}
            />
          </div>
        </div>
      )}
    </>
  )
}
