import axios from 'axios'
import { getToken } from './authStorage'

const api = axios.create({
  baseURL: 'http://localhost:5083/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api