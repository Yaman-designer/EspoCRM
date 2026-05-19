import axios from 'axios'

// All requests are proxied through Next.js /api/espo.
// The EspoCRM URL and auth token are injected server-side — never exposed to the browser.
const axiosClient = axios.create({
  baseURL: '/api/espo',
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)

export default axiosClient
