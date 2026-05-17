'use client'

import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface SubmitButtonProps {
  isPending: boolean
}

export function SubmitButton({ isPending }: SubmitButtonProps) {
  const { t } = useTranslation('auth')

  return (
    <div className="relative">
      {/* Coloured glow beneath the button — lifts on hover via parent translate */}
      <div
        aria-hidden
        className="absolute inset-x-6 bottom-0 h-6 translate-y-2 rounded-full bg-primary/20 blur-lg transition-opacity duration-200"
      />
      <Button
        type="submit"
        size="lg"
        className="relative w-full text-base font-semibold"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
            {t('signingIn')}
          </>
        ) : (
          t('signIn')
        )}
      </Button>
    </div>
  )
}
