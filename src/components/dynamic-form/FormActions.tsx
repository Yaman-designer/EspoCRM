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
      <div className="shrink-0 border-t border-border/50 bg-muted/20 px-6 py-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="border-border/60">
            {t('form.close')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-border/50 bg-muted/20 px-6 py-4">
      {isError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-[12px] text-destructive">{resolvedError}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {t('form.fieldsRequired').split('*').map((part, i, arr) =>
            i < arr.length - 1
              ? [part, <span key={i} className="text-destructive">*</span>]
              : part
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-border/60"
          >
            {t('form.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
