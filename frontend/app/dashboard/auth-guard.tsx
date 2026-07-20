"use client"

import { useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

const ADMIN_ROUTES = [
  "/dashboard/students",
]

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user, hasRole, logout } = useAuth()

  const redirectToLogin = useCallback(() => {
    router.replace("/login")
  }, [router])

  useEffect(() => {
    function handleAuthExpired() {
      logout()
      redirectToLogin()
    }
    window.addEventListener("auth:expired", handleAuthExpired)
    return () => window.removeEventListener("auth:expired", handleAuthExpired)
  }, [logout, redirectToLogin])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      redirectToLogin()
      return
    }

    if (!hasRole("admin", "teacher")) {
      redirectToLogin()
      return
    }

    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
    if (isAdminRoute && user?.role !== "admin") {
      router.replace("/dashboard")
      return
    }
  }, [isLoading, isAuthenticated, pathname, router, hasRole, redirectToLogin, user])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-content-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return <>{children}</>
}
