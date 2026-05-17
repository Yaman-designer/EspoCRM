'use client'

import { useState } from 'react'
import type { Control } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { LoginInput } from '@/lib/schemas/auth'

interface PasswordFieldProps {
  control: Control<LoginInput>
  disabled?: boolean
}

export function PasswordField({ control, disabled }: PasswordFieldProps) {
  const { t } = useTranslation('auth')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('password')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={disabled}
                className="pe-11 shadow-[0_1px_4px_rgba(16,24,40,0.07)]"
                {...field}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={disabled}
                className={[
                  'absolute inset-y-0 end-0 flex items-center px-3 rounded-e-lg',
                  'text-muted-foreground transition-colors duration-150 hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1',
                  'disabled:pointer-events-none',
                ].join(' ')}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
