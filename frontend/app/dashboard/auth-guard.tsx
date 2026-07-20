"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

const TEACHER_ROUTES = [
  "/dashboard/exams/create",
  "/dashboard/settings",
]

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user, hasRole } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!hasRole("admin", "teacher")) {
      router.replace("/login")
      return
    }

    const isTeacherRoute = TEACHER_ROUTES.some((route) => pathname.startsWith(route))
    if (isTeacherRoute && !hasRole("admin", "teacher")) {
      router.replace("/dashboard")
      return
    }
  }, [isLoading, isAuthenticated, pathname, router, hasRole])

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
