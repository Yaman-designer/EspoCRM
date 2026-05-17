'use client'

import type { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import type { LoginInput } from '@/lib/schemas/auth'

interface RememberMeFieldProps {
  control: Control<LoginInput>
  disabled?: boolean
}

export function RememberMeField({ control, disabled }: RememberMeFieldProps) {
  const { t } = useTranslation('auth')

  return (
    <FormField
      control={control}
      name="rememberMe"
      render={({ field }) => (
        <FormItem className="flex items-center gap-2.5 space-y-0">
          <FormControl>
            <Checkbox
              id="rememberMe"
              className="border-gray-300"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormLabel
            htmlFor="rememberMe"
            className="cursor-pointer select-none text-sm font-normal text-muted-foreground "
          >
            {t('rememberMe')}
          </FormLabel>
        </FormItem>
      )}
    />
  )
}
