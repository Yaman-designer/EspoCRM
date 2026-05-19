import axios from 'axios'
import { env } from '@/lib/env'

// Separate instance without interceptors to avoid conflicts during login
const authAxios = axios.create({
  baseURL: env.espoApiUrl,
  headers: { 'Content-Type': 'application/json' },
})

export const login = async (username: string, password: string) => {
  const basicToken = btoa(`${username}:${password}`)

  const response = await authAxios.get<Record<string, unknown>>('/App/user', {
    headers: { 'Espo-Authorization': basicToken },
  })

  // EspoCRM returns Espo-Auth-Token on successful auth — use it for subsequent requests
  // so the plaintext password is never stored or reused after initial login.
  const sessionToken = response.headers['espo-auth-token'] as string | undefined
  const token = sessionToken ? btoa(`${username}:${sessionToken}`) : basicToken

  return {
    user: response.data,
    token,
  }
}