'use client'

import Flag from 'react-world-flags'
import { Globe, Check } from 'lucide-react'
import { useLanguageStore, languageLabels, type Language } from '@/store/languageStore'
import { cn } from '@/lib/utils'
import { btnCls } from './styles'

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export function LangDropdown({ isOpen, onToggle }: Props) {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(btnCls, isOpen && 'bg-muted text-foreground')}
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute inset-e-0 top-[calc(100%+8px)] z-20 min-w-[130px] rounded-xl border border-border bg-popover py-1 shadow-design-md">
            {(Object.entries(languageLabels) as [Language, { label: string; code: string }][]).map(
              ([langCode, meta]) => (
                <button
                  key={langCode}
                  onClick={() => { setLanguage(langCode); onToggle() }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted',
                    language === langCode ? 'text-primary' : 'text-foreground',
                  )}
                >
                  <Flag
                    code={meta.code}
                    style={{ width: 24, height: 16 }}
                    className="shrink-0 rounded-sm object-cover"
                  />
                  <span className="flex-1 text-start">{meta.label}</span>
                  {language === langCode && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}
