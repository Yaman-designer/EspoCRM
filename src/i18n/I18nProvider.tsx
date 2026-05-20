'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './config'
import { useLanguageStore } from '@/store/languageStore'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((s) => s.language)

  useEffect(() => {
    i18n.changeLanguage(language)
    document.documentElement.lang = language
  }, [language])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
