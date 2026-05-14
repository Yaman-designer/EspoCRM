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
          return { error: 'Invalid username or password' }
        default:
          return { error: 'An unexpected error occurred, please try again' }
      }
    }
    // Rethrow redirect error - Next.js handles it automatically
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
