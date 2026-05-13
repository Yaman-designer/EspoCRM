import axios from 'axios'
import Cookies from 'js-cookie'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ESPO_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// يضيف توكن EspoCRM تلقائياً لكل طلب (يُعبأ بواسطة AuthProvider)
axiosClient.interceptors.request.use((config) => {
  const token = Cookies.get('espo-token')
  if (token) {
    config.headers['Espo-Authorization'] = token
  }
  return config
})

// معالجة أخطاء 401 — تسجيل خروج تلقائي
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
