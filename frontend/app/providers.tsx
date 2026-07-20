"use client"

import { AuthProvider } from "@/lib/auth-context"
import { ToastProvider } from "@/components/ui/toast"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}
