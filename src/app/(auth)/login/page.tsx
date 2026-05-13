import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'تسجيل الدخول | Ebla CRM',
  description: 'تسجيل الدخول إلى نظام إدارة علاقات العملاء',
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4">
      {/* خلفية ديكورية */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
      />
      <LoginForm />
    </main>
  )
}
