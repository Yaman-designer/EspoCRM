'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { setTheme } = useTheme()

  function toggle() {
    /*
     * Read the CURRENT DOM class at click time rather than the React context
     * value. The DOM is always up-to-date (it's the source of truth for our
     * useSyncExternalStore), so this is immune to any React state timing lag
     * between applyTheme() being called and the context value propagating.
     */
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border border-border',
        'bg-background text-muted-foreground transition-all duration-200',
        'hover:bg-muted hover:text-foreground hover:border-border/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      {/*
       * CSS-driven visibility: both icons are always in the DOM.
       * No React state involved → no hydration mismatch.
       * The .dark class on <html> is set before React runs (by the
       * blocking script in layout.tsx), so icons render correctly
       * on the very first paint.
       */}
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun  className="h-4 w-4 hidden dark:block" />
    </button>
  )
}
