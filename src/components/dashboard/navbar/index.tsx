'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSidebarStore } from '@/store/sidebarStore'
import { cn } from '@/lib/utils'
import { btnCls } from './styles'
import { SidebarToggle } from './SidebarToggle'
import { LangDropdown } from './LangDropdown'
import { NotifDropdown } from './NotifDropdown'
import { ProfileDropdown } from './ProfileDropdown'
import { SearchDropdown } from './SearchDropdown'

type OpenDropdown = 'lang' | 'notif' | 'profile' | null

export function TopNavbar() {
  const { width, mobileOpen, toggle, setMobileOpen } = useSidebarStore()

  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const { t } = useTranslation('common')
  const isCollapsed = width <= 64

  const toggleDropdown = (name: OpenDropdown) =>
    setOpenDropdown((prev) => (prev === name ? null : name))

  useEffect(() => {
    if (searchOpen) mobileSearchInputRef.current?.focus()
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
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md md:gap-3 md:px-6">

        <SidebarToggle
          mobileOpen={mobileOpen}
          isCollapsed={isCollapsed}
          onToggle={handleSidebarToggle}
        />

        {/* Search bar with live results — desktop only */}
        <div className="hidden flex-1 md:block">
          <SearchDropdown />
        </div>

        {/* Spacer — pushes right group to end on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right action group */}
        <div className="flex items-center gap-1">

          {/* Search icon — mobile only */}
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className={cn(btnCls, 'md:hidden', searchOpen && 'bg-muted text-foreground')}
            aria-label={searchOpen ? t('closeSearch') : t('openSearch')}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

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
        <div className="sticky top-14 z-30 border-b border-border bg-background px-4 py-3 shadow-design-sm md:hidden">
          <SearchDropdown
            inputRef={mobileSearchInputRef}
            className="w-full"
            onClose={() => setSearchOpen(false)}
          />
        </div>
      )}
    </>
  )
}
