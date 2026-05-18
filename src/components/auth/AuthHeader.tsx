'use client'

import { useTranslation } from 'react-i18next'

export function AuthHeader() {
  const { t } = useTranslation('auth')

  return (
    <header className="space-y-2">
      <h1 className="text-[1.875rem] font-bold leading-tight tracking-tight text-foreground">
        {t('welcomeBack', 'Welcome back')}
      </h1>
      <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted-foreground/85">
        {t('loginSubtitle', 'Sign in to continue managing your workspace')}
      </p>
    </header>
  )
}
