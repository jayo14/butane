"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

const acceptSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
})

type AcceptSchema = z.infer<typeof acceptSchema>

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptSchema>({
    resolver: zodResolver(acceptSchema),
  })

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    fetch(`${base}/api/invitations/${params.token}/accept/`, { method: "GET" })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid invitation")
        return res.json()
      })
      .then((data) => {
        if (data.email) setInviteEmail(data.email)
      })
      .catch(() => {
        setError("This invitation link is invalid or has expired.")
      })
  }, [params.token])

  async function onSubmit(data: AcceptSchema) {
    setError("")
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${base}/api/invitations/${params.token}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          ...data,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Failed to accept invitation")
      }
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 text-success" size={48} />
          <h1 className="text-2xl font-bold">Welcome aboard!</h1>
          <p className="mt-2 text-sm text-content-secondary">Your account has been created. Redirecting to login...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Accept Invitation</h1>
          <p className="text-sm text-content-secondary">
            {inviteEmail ? `You're invited as ${inviteEmail}` : "Complete your account setup"}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-light p-3 text-sm text-danger">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input {...register("firstName")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.firstName && "border-danger")} />
            {errors.firstName && <p className="mt-1 text-xs text-danger">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input {...register("lastName")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.lastName && "border-danger")} />
            {errors.lastName && <p className="mt-1 text-xs text-danger">{errors.lastName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" {...register("password")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.password && "border-danger")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Accept Invitation
          </Button>
        </form>
      </Card>
    </div>
  )
}
