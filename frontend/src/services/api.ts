import axios from 'axios'

import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearAuthStorage,
} from './authStorage'

const api = axios.create({
  baseURL: 'http://localhost:5083/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false

let refreshSubscribers: Array<
  (token: string) => void
> = []

const subscribeToRefresh = (
  callback: (token: string) => void,
) => {
  refreshSubscribers.push(callback)
}

const notifyRefreshSubscribers = (
  token: string,
) => {
  refreshSubscribers.forEach((callback) => {
    callback(token)
  })

  refreshSubscribers = []
}

const rejectRefreshSubscribers = () => {
  refreshSubscribers = []
}

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('No refresh token available.')
  }

  const response = await axios.post(
    'http://localhost:5083/api/Authentication/refresh',
    {
      refreshToken,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  const newAccessToken = response.data.token
  const newRefreshToken = response.data.refreshToken

  setToken(newAccessToken)
  setRefreshToken(newRefreshToken)

  return newAccessToken
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    const requestUrl = originalRequest?.url ?? ''

    const isAuthRequest =
      requestUrl.includes('/Authentication/login') ||
      requestUrl.includes('/Authentication/refresh') ||
      requestUrl.includes('/Authentication/logout')

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (!originalRequest.headers) {
            originalRequest.headers = {}
          }

          originalRequest.headers.Authorization =
            `Bearer ${token}`

          api(originalRequest)
            .then(resolve)
            .catch(reject)
        })
      })
    }

    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()

      notifyRefreshSubscribers(newToken)

      if (!originalRequest.headers) {
        originalRequest.headers = {}
      }

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`

      return api(originalRequest)
    } catch (refreshError) {
      rejectRefreshSubscribers()
      clearAuthStorage()

      window.location.href = '/login'

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api