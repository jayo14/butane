"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { api, type ApiUser } from "./api"

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  user: "auth_user",
}

const REFRESH_MARGIN_SECONDS = 5 * 60

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

interface JwtPayload {
  exp?: number
  iat?: number
  [key: string]: unknown
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

function decodeJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}

function getTokenExpirySeconds(token: string): number | null {
  const payload = decodeJwt(token)
  return payload?.exp ?? null
}

function isTokenExpired(token: string, margin = 0): boolean {
  const exp = getTokenExpirySeconds(token)
  if (!exp) return true
  return (exp - margin) * 1000 < Date.now()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doLogout = useCallback((redirect = true) => {
    clearSession()
    setState({ user: null, isLoading: false, isAuthenticated: false })
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    if (redirect && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
    }
  }, [])

  const scheduleRefresh = useCallback((accessToken: string) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    const exp = getTokenExpirySeconds(accessToken)
    if (!exp) return

    const now = Date.now()
    const expiryMs = exp * 1000
    const refreshAt = expiryMs - REFRESH_MARGIN_SECONDS * 1000
    const delayMs = Math.max(refreshAt - now, 10000)

    refreshTimerRef.current = setTimeout(async () => {
      const stored = getAccessToken()
      if (!stored) return
      const payload = decodeJwt(stored)
      if (!payload?.exp) return

      const remainingSeconds = payload.exp - Math.floor(Date.now() / 1000)
      if (remainingSeconds <= REFRESH_MARGIN_SECONDS) {
        const refresh = getRefreshToken()
        if (!refresh) {
          doLogout(true)
          return
        }
        try {
          const res = await api.auth.refresh(refresh)
          localStorage.setItem(STORAGE_KEYS.access, res.access)
          if (res.refresh) localStorage.setItem(STORAGE_KEYS.refresh, res.refresh)
          scheduleRefresh(res.access)
        } catch {
          doLogout(true)
        }
      }
    }, delayMs)
  }, [doLogout])

  const attemptInitialRefresh = useCallback(async (): Promise<string | null> => {
    const access = getAccessToken()
    if (!access) return null

    if (!isTokenExpired(access, REFRESH_MARGIN_SECONDS)) {
      scheduleRefresh(access)
      return access
    }

    const refresh = getRefreshToken()
    if (!refresh) return null

    try {
      const res = await api.auth.refresh(refresh)
      localStorage.setItem(STORAGE_KEYS.access, res.access)
      if (res.refresh) localStorage.setItem(STORAGE_KEYS.refresh, res.refresh)
      scheduleRefresh(res.access)
      return res.access
    } catch {
      return null
    }
  }, [scheduleRefresh])

  useEffect(() => {
    async function init() {
      const user = loadUser()
      if (!user) {
        setState({ user: null, isLoading: false, isAuthenticated: false })
        return
      }

      const token = await attemptInitialRefresh()
      if (!token) {
        clearSession()
        setState({ user: null, isLoading: false, isAuthenticated: false })
        return
      }

      setState({ user, isLoading: false, isAuthenticated: true })
    }

    init()

    function onAuthExpired() {
      doLogout(true)
    }

    window.addEventListener("auth:expired", onAuthExpired)
    return () => {
      window.removeEventListener("auth:expired", onAuthExpired)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [attemptInitialRefresh, doLogout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    const data = res as unknown as LoginResponse
    if (!data.user) {
      const user = await api.auth.me().catch(() => null)
      if (!user) throw new Error("Login succeeded but could not load user profile")
      saveSession(data.access, data.refresh, user)
      setState({ user, isLoading: false, isAuthenticated: true })
      scheduleRefresh(data.access)
    } else {
      saveSession(data.access, data.refresh, data.user)
      setState({ user: data.user, isLoading: false, isAuthenticated: true })
      scheduleRefresh(data.access)
    }
  }, [scheduleRefresh])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) await api.auth.logout(refresh)
    } catch {
      // ignore logout errors
    }
    doLogout(false)
  }, [doLogout])

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const refresh = getRefreshToken()
    if (!refresh) return null
    try {
      const res = await api.auth.refresh(refresh)
      localStorage.setItem(STORAGE_KEYS.access, res.access)
      if (res.refresh) localStorage.setItem(STORAGE_KEYS.refresh, res.refresh)
      scheduleRefresh(res.access)
      return res.access
    } catch {
      doLogout(true)
      return null
    }
  }, [scheduleRefresh, doLogout])

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
