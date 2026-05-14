import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'en' | 'el'

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'ebla-language' }
  )
)

export const languageLabels: Record<Language, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  el: { label: 'Greek', flag: '🇬🇷' },
}
