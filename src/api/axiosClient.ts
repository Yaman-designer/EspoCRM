import axios from 'axios'
import Cookies from 'js-cookie'
import { getSession } from 'next-auth/react'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ESPO_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use(async (config) => {
  let token = Cookies.get('espo-token')
  if (!token) {
    const session = await getSession()
    token = session?.espoToken
    if (token) {
      Cookies.set('espo-token', token, { expires: 7, sameSite: 'strict' })
    }
  }
  if (token) {
    config.headers['Espo-Authorization'] = token
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('espo-token')
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient