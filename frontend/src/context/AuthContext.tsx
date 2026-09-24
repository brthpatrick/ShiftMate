import {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'

import type { ReactNode } from 'react'

import { login as loginRequest, logout as logoutRequest } from '../services/authService'

import {
  getToken,
  clearAuthStorage,
} from '../services/authStorage'

import type { LoginRequest } from '../types/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getToken() !== null,
  )

  const login = async (
    credentials: LoginRequest,
  ) => {
    await loginRequest(credentials)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      clearAuthStorage()
      setIsAuthenticated(false)
    }
  }

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider',
    )
  }

  return context
}