import axios from 'axios'

// نستخدم instance منفصلة بدون interceptors لتجنب التعارض أثناء تسجيل الدخول
const authAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ESPO_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const login = async (username: string, password: string) => {
  const token = btoa(`${username}:${password}`)

  const response = await authAxios.get('/App/user', {
    headers: { 'Espo-Authorization': token },
  })

  return {
    user: response.data,
    token,
  }
}
