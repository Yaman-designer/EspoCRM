'use client'

import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FormMode } from './types'

interface FormActionsProps {
  isSubmitting: boolean
  isError: boolean
  errorMessage?: string
  onCancel: () => void
  submitLabel: string
  mode?: FormMode
}

export function FormActions({
  isSubmitting,
  isError,
  errorMessage,
  onCancel,
  submitLabel,
  mode,
}: FormActionsProps) {
  const { t } = useTranslation('common')
  const resolvedError = errorMessage ?? t('form.failedToSave')

  if (mode === 'view') {
    return (
      <div className="shrink-0 border-t border-border/30 bg-muted/10 px-6 py-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 border-border/60 px-5 text-[13px] font-medium"
          >
            {t('form.close')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-border/30 bg-muted/10 px-6 py-4">
      {isError && (
        <div className="mb-3.5 flex items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          <p className="text-[12px] font-medium text-destructive">{resolvedError}</p>
        </div>
      )}
      <div className="flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 px-4 text-[13px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          {t('form.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 min-w-[130px] px-6 text-[13px] font-semibold shadow-sm transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              {t('form.saving')}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  )
}
