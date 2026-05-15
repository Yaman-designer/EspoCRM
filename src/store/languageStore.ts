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

export const languageLabels: Record<Language, { label: string; code: string }> = {
  en: { label: 'English', code: 'GB' },
  el: { label: 'Ελληνικά', code: 'GR' },
}
