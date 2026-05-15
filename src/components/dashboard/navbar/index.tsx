'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { useSidebarStore } from '@/store/sidebarStore'
import { cn } from '@/lib/utils'
import { btnCls } from './styles'
import { SidebarToggle } from './SidebarToggle'
import { LangDropdown } from './LangDropdown'
import { NotifDropdown } from './NotifDropdown'
import { ProfileDropdown } from './ProfileDropdown'

type OpenDropdown = 'lang' | 'notif' | 'profile' | null

export function TopNavbar() {
  const { width, mobileOpen, toggle, setMobileOpen } = useSidebarStore()

  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isCollapsed = width <= 64

  const toggleDropdown = (name: OpenDropdown) =>
    setOpenDropdown((prev) => (prev === name ? null : name))

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function handleSidebarToggle() {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileOpen(!mobileOpen)
    } else {
      toggle()
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[72px] items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md md:gap-3 md:px-6">

        <SidebarToggle
          mobileOpen={mobileOpen}
          isCollapsed={isCollapsed}
          onToggle={handleSidebarToggle}
        />

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

        </div>

        {/* Spacer — pushes right group to end on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right action group */}
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

          <LangDropdown
            isOpen={openDropdown === 'lang'}
            onToggle={() => toggleDropdown('lang')}
          />

          <NotifDropdown
            isOpen={openDropdown === 'notif'}
            onToggle={() => toggleDropdown('notif')}
          />

          <ProfileDropdown
            isOpen={openDropdown === 'profile'}
            onToggle={() => toggleDropdown('profile')}
          />
        </div>
      </header>

      {/* Mobile expandable search bar */}
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
