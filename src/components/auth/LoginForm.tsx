'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { loginAction } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { AuthHeader } from './AuthHeader'
import { PasswordField } from './PasswordField'
import { RememberMeField } from './RememberMeField'
import { SubmitButton } from './SubmitButton'

export function LoginForm() {
  const { t } = useTranslation('auth')
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  })

  const handleLoginSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data)
      if (result?.error) {
        toast.error(result.error, {
          description: t('credentialError'),
        })
        form.setFocus('username')
        form.setValue('password', '')
      }
    })
  }

  return (
    <section
      className="w-full max-w-md space-y-8"
      aria-label={t('signInAriaLabel', 'Sign in form')}
    >
      <AuthHeader />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleLoginSubmit)}
          className="space-y-5"
          noValidate
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('username')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="admin"
                    autoComplete="username"
                    autoFocus
                    disabled={isPending}
                    className="shadow-[0_1px_4px_rgba(16,24,40,0.07)]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <PasswordField control={form.control} disabled={isPending} />

          <RememberMeField control={form.control} disabled={isPending} />

          <div className="pt-1">
            <SubmitButton isPending={isPending} />
          </div>

          <p className="flex select-none items-center justify-center gap-1.5 text-xs text-muted-foreground/55">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('secureLogin', 'Secured with enterprise-grade encryption')}
          </p>
        </form>
      </Form>
    </section>
  )
}
