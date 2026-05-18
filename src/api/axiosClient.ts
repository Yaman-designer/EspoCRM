import axios from 'axios'
import Cookies from 'js-cookie'

const isDev = process.env.NODE_ENV === 'development'

const axiosClient = axios.create({
baseURL: process.env.NEXT_PUBLIC_ESPO_API_URL!,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor ────────────────────────────────────────────────────────

axiosClient.interceptors.request.use((config) => {
  const token = Cookies.get('espo-token')

  if (token) {
    config.headers['Espo-Authorization'] = token
  }

  if (isDev) {
    const hasToken = !!token
    console.debug(
      `[axiosClient] ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url ?? ''}`,
      hasToken
        ? `| Espo-Authorization: ${token!.slice(0, 12)}…`
        : '| ⚠ NO espo-token cookie found',
    )
  }

  return config
})

// ── Response interceptor ───────────────────────────────────────────────────────

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status
    const url: string = error.config?.url ?? ''

    if (isDev) {
      console.error(
        `[axiosClient] ${status} on ${url}`,
        '\nHeaders sent:', error.config?.headers,
        '\nResponse body:', error.response?.data,
      )
    }

    if (status === 401) {
      // Token rejected — clear it so the next request won't send a stale token
      Cookies.remove('espo-token')
    }

    return Promise.reject(error)
  },
)

export default axiosClient
