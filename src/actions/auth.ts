'use server'

import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/lib/auth'
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/config'
import type { LoginInput } from '@/lib/schemas/auth'

export async function loginAction(
  data: LoginInput
): Promise<{ error?: string } | undefined> {
  try {
    await signIn('credentials', {
      username: data.username,
      password: data.password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
        default:
          return { error: 'حدث خطأ غير متوقع، يرجى المحاولة مجدداً' }
      }
    }
    // إعادة رمي خطأ الـ redirect — Next.js يتعامل معه تلقائياً
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
