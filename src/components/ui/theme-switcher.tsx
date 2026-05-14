'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted"
        aria-hidden
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-xl border border-border',
        'bg-background text-muted-foreground transition-all duration-250',
        'hover:bg-muted hover:text-foreground hover:border-border/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
