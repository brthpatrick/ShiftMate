import api from './api'

import {
  setToken,
  setRefreshToken,
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