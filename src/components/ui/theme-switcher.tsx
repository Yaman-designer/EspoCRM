'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const THEME_COOKIE = 'ebla-crm-theme'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { setTheme } = useTheme()

  function toggle() {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    setTheme(next)
    /*
     * Write a cookie so the server can read the theme on the next request
     * and bake the correct class into the HTML before the first paint.
     */
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`
  }

  return (
    <button
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
      {/* Visibility is CSS-driven — both icons are always in the DOM,
          no JS state or mounted guard needed, no hydration mismatch. */}
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun  className="h-4 w-4 hidden dark:block" />
    </button>
  )
}
