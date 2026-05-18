import axios from 'axios'

// We use a separate instance without interceptors to avoid conflicts during login
const authAxios = axios.create({
baseURL: process.env.NEXT_PUBLIC_ESPO_API_URL!,
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
