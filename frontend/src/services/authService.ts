import api from './api'

import {
  setToken,
  setRefreshToken,
  getRefreshToken,
} from './authStorage'

import type {
  LoginRequest,
  LoginResponse,
} from '../types/auth'

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    '/Authentication/login',
    credentials,
  )

  setToken(response.data.token)
  setRefreshToken(response.data.refreshToken)

  return response.data
}

export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return
  }

  await api.post('/Authentication/logout', {
    refreshToken,
  })
}