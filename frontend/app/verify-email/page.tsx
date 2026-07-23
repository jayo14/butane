"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const school = searchParams.get("school")
    const token = searchParams.get("token")
    if (!school || !token) {
      setStatus("error")
      setErrorMsg("Missing verification parameters.")
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/schools/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school, token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || "Verification failed")
        }
        setStatus("success")
        setTimeout(() => router.push("/login"), 3000)
      })
      .catch((err) => {
        setStatus("error")
        setErrorMsg(err.message)
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={48} />
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
            <p className="mt-2 text-sm text-content-secondary">Please wait while we activate your school.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-success" size={48} />
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="mt-2 text-sm text-content-secondary">Your school is now active. Redirecting to login...</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="mx-auto mb-4 text-danger" size={48} />
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="mt-2 text-sm text-content-secondary">{errorMsg}</p>
            <Button variant="primary" className="mt-6" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
