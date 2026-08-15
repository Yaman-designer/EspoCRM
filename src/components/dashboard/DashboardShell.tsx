'use client'

import { useLayoutEffect, useEffect, Suspense } from 'react'
import { useSidebarStore } from '@/store/sidebarStore'
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { TopNavbar } from '@/components/dashboard/navbar'
import { BackToTopButton } from '@/components/dashboard/BackToTopButton'
import { BottomNav } from '@/components/dashboard/bottom-nav'

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
      <Suspense fallback={<div style={{ width: 'var(--sidebar-w, 220px)' }} className="shrink-0" />}>
        <AppSidebar />
      </Suspense>

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
        {/* max-md:pb reserves clearance for BottomNav below content — its
            floating bar (BottomNav.tsx: content-derived height via
            BottomNavItem's own `py-2.5`, ~70px live, not a fixed `h-*`) sits
            at `bottom-[calc(0.875rem+env(safe-area-inset-bottom))]`; this
            pads past that footprint plus a breathing gap so scrolled-to-
            bottom content (e.g. pagination controls) is never left
            underneath the bar. Keep these two in sync if BottomNav's own
            dimensions change. Desktop (md+) has no bottom nav, so no
            reservation is needed. */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 max-md:pb-[calc(96px+env(safe-area-inset-bottom))]">{children}</main>
      </div>

      <BackToTopButton />
      {/* Production-build fix (2026-08-08). BottomNav reads `usePathname()`
          for its own active-tab logic (untouched — same requirement as
          AppSidebar's own pathname-driven active-link highlighting above),
          but unlike AppSidebar it wasn't wrapped in Suspense — Cache
          Components (`next build`) failed prerendering
          `/properties/[slug]` with "Uncached data accessed outside
          Suspense", pointing directly at this usePathname() call. Same
          fix as AppSidebar's own boundary, not a BottomNav change: wrap the
          call site here. `fallback={null}` (not a placeholder box like
          AppSidebar's) because BottomNav is `fixed`-positioned — it never
          occupies document flow, so there's no layout space to reserve and
          no CLS risk from a brief absence. */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  )
}
