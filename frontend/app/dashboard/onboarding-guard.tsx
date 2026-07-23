"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getAccessToken } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface OnboardingGuardProps {
  children: ReactNode
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(`${API}/api/schools/onboarding-status/`, { headers })
        if (!res.ok) {
          setChecking(false)
          return
        }
        const data = await res.json()
        if (!data.onboarding_completed) {
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
