"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api, apiFetch, type ApiUser } from "./api"

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  user: "auth_user",
}

interface LoginResponse {
  access: string
  refresh: string
  user: ApiUser
}

interface AuthState {
  user: ApiUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): ApiUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEYS.user)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveSession(access: string, refresh: string, user: ApiUser) {
  localStorage.setItem(STORAGE_KEYS.access, access)
  localStorage.setItem(STORAGE_KEYS.refresh, refresh)
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.user)
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.access)
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.refresh)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const user = loadUser()
    const token = getAccessToken()
    if (user && token) {
      setState({ user, isLoading: false, isAuthenticated: true })
    } else {
      clearSession()
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    const data = res as unknown as LoginResponse
    if (!data.user) {
      const user = await api.auth.me().catch(() => null)
      if (!user) throw new Error("Login succeeded but could not load user profile")
      saveSession(data.access, data.refresh, user)
      setState({ user, isLoading: false, isAuthenticated: true })
    } else {
      saveSession(data.access, data.refresh, data.user)
      setState({ user: data.user, isLoading: false, isAuthenticated: true })
    }
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) await api.auth.logout(refresh)
    } catch {
      // ignore logout errors
    }
    clearSession()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const refresh = getRefreshToken()
    if (!refresh) return null
    try {
      const res = await api.auth.refresh(refresh)
      localStorage.setItem(STORAGE_KEYS.access, res.access)
      return res.access
    } catch {
      clearSession()
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return null
    }
  }, [])

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!state.user) return false
      return roles.includes(state.user.role)
    },
    [state.user],
  )

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export { getAccessToken, getRefreshToken }
