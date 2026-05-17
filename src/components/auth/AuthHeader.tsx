'use client'

import { useTranslation } from 'react-i18next'

export function AuthHeader() {
  const { t } = useTranslation('auth')

  return (
    <header className="space-y-2">
      {/* Brand mark */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]
            bg-gradient-to-br from-primary to-[#1A7ACC]
            shadow-[0_4px_12px_rgba(0,97,188,0.32)]"
          aria-hidden
        >
          <span className="text-sm font-bold leading-none text-white">E</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[0.9rem] font-semibold tracking-tight text-foreground">
            Ebla CRM
          </span>
          <span
            className="rounded-full bg-primary/8 px-2 py-px
              text-[10px] font-semibold leading-tight text-primary/80"
          >
            Enterprise
          </span>
        </div>
      </div>

      <h1 className="text-[1.875rem] font-bold leading-tight tracking-tight text-foreground">
        {t('welcomeBack', 'Welcome back')}
      </h1>
      <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted-foreground/85">
        {t('loginSubtitle', 'Sign in to continue managing your workspace')}
      </p>
    </header>
  )
}
