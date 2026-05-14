import axios from 'axios'
import Cookies from 'js-cookie'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ESPO_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Automatically adds EspoCRM token to each request (populated by AuthProvider)
axiosClient.interceptors.request.use((config) => {
  const token = Cookies.get('espo-token')
  if (token) {
    config.headers['Espo-Authorization'] = token
  }
  return config
})

// Handle 401 errors - auto logout
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('espo-token')
    }
    return Promise.reject(error)
  }
)

export default axiosClient
