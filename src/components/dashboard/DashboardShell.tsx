'use client'

import { useLayoutEffect, useEffect } from 'react'
import { useSidebarStore } from '@/store/sidebarStore'
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { TopNavbar } from '@/components/dashboard/navbar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { width, mobileOpen, setMobileOpen, dragging } = useSidebarStore()

  /*
   * useLayoutEffect fires synchronously after DOM mutations but BEFORE the
   * browser paints — so the CSS variable is always correct on every frame,
   * with zero visual lag even during fast drag.
   */
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', `${width}px`)
  }, [width])

  /* Close mobile sidebar when viewport grows to desktop width */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [setMobileOpen])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Mobile backdrop — shown only when sidebar is open on mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/*
       * CSS class "dashboard-main" handles margin-left via CSS variable.
       * data-dragging disables the CSS transition during active resize.
       */}
      <div
        className="dashboard-main flex min-h-screen flex-col"
        data-dragging={dragging || undefined}
      >
        <TopNavbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
