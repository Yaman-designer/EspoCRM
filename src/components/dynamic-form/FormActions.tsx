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
      <div className="shrink-0 border-t border-border/30 bg-muted/20 px-6 py-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="h-9 border-border/50 text-[13px] font-medium">
            {t('form.close')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-border/30 bg-gradient-to-b from-muted/5 to-muted/20 px-5 py-4">
      {isError && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/6 px-3.5 py-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15">
            <AlertCircle className="h-3 w-3 text-destructive" />
          </div>
          <p className="text-[12px] font-medium text-destructive">{resolvedError}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground/50">
          {t('form.fieldsRequired').split('*').map((part, i, arr) =>
            i < arr.length - 1
              ? [part, <span key={i} className="text-destructive">*</span>]
              : part
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-4 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            {t('form.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 min-w-[120px] px-5 text-[13px] font-semibold shadow-sm"
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
    </div>
  )
}
