"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export function ForgotPasswordForm() {
  const [isSent, setIsSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  })

  async function onSubmit(_data: ForgotFormData) {
    await new Promise((r) => setTimeout(r, 1500))
    setIsSent(true)
  }

  if (isSent) {
    return (
      <div className="py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success-light text-success">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-bold text-content-primary">Check your email</h1>
        <p className="mt-2 text-content-secondary">
          We&apos;ve sent a password reset link to your email address. It will expire in 1 hour.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="py-8">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">Forgot password?</h1>
        <p className="mt-1.5 text-content-secondary">
          No worries. Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-content-primary">
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-content-muted">
              <Mail size={18} />
            </div>
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                "block w-full rounded-xl border bg-white py-2.5 pl-11 pr-4 text-sm text-content-primary placeholder:text-content-secondary",
                "transition-all duration-200",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors.email ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold text-white",
            "transition-all duration-200",
            "bg-primary hover:bg-primary-hover",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending reset link...
            </>
          ) : (
            <>
              <Mail size={18} />
              Send reset link
            </>
          )}
        </button>
      </form>
    </div>
  )
}
