'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/providers/AuthProvider'
import { logoutAction } from '@/actions/auth'
import { ChevronDown, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export function ProfileDropdown({ isOpen, onToggle }: Props) {
  const { t } = useTranslation('common')
  const { session } = useAuth()
  const userName = session?.user?.name ?? 'User'
  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl border border-border px-2.5',
          'bg-background text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted',
          isOpen && 'bg-muted',
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </div>
        <span className="hidden max-w-[120px] truncate md:block">{userName}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
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
                onClick={onToggle}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                {t('profile')}
              </Link>
            </div>

            <div className="border-t border-border py-1">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logOut')}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
