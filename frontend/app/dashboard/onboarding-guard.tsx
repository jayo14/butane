"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getAccessToken } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface OnboardingGuardProps {
  children: ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (pathname.startsWith("/dashboard/onboarding")) {
      setChecking(false)
      return
    }

    async function checkOnboarding() {
      try {
        const token = getAccessToken()
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/academics/sessions/?page_size=1`,
          { headers },
        )
        if (!res.ok) {
          setChecking(false)
          return
        }
        const data = await res.json()
        const sessions = data.results || []
        if (sessions.length === 0) {
          router.replace("/dashboard/onboarding")
          return
        }
      } catch {
        // ignore and show dashboard
      } finally {
        setChecking(false)
      }
    }

    checkOnboarding()
  }, [pathname, router])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-content-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
