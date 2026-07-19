"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const resetSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetFormData = z.infer<typeof resetSchema>

interface ResetPasswordFormProps {
  token?: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isComplete, setIsComplete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: "onBlur",
    defaultValues: { password: "", confirmPassword: "" },
  })

  const passwordValue = watch("password")

  const requirements = [
    { label: "At least 8 characters", met: (passwordValue?.length ?? 0) >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(passwordValue ?? "") },
    { label: "One lowercase letter", met: /[a-z]/.test(passwordValue ?? "") },
    { label: "One number", met: /[0-9]/.test(passwordValue ?? "") },
  ]

  async function onSubmit(_data: ResetFormData) {
    await new Promise((r) => setTimeout(r, 1500))
    setIsComplete(true)
  }

  if (!token) {
    return (
      <div className="py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-danger-light text-danger">
          <AlertCircle size={36} />
        </div>
        <h1 className="text-2xl font-bold text-content-primary">Invalid or expired link</h1>
        <p className="mt-2 text-content-secondary">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Request new reset link
        </Link>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success-light text-success">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-bold text-content-primary">Password reset complete</h1>
        <p className="mt-2 text-content-secondary">
          Your password has been successfully reset. Sign in with your new password.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft size={18} />
          Sign in
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
        <h1 className="text-2xl font-bold text-content-primary">Reset password</h1>
        <p className="mt-1.5 text-content-secondary">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-content-primary">
            New password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-content-muted">
              <Lock size={18} />
            </div>
            <input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className={cn(
                "block w-full rounded-xl border bg-white py-2.5 pl-11 pr-10 text-sm text-content-primary placeholder:text-content-secondary",
                "transition-all duration-200",
                "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                errors.password ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
              )}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted transition-colors hover:text-content-primary"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.password.message}
            </p>
          )}
          {passwordValue && (
            <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {requirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-1.5 rounded-full transition-colors duration-200",
                      req.met ? "bg-success" : "bg-content-muted/40",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors duration-200",
                      req.met ? "text-success" : "text-content-muted",
                    )}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-content-primary">
            Confirm password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-content-muted">
              <Lock size={18} />
            </div>
            <input
              {...register("confirmPassword")}
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              className={cn(
                "block w-full rounded-xl border bg-white py-2.5 pl-11 pr-10 text-sm text-content-primary placeholder:text-content-secondary",
                "transition-all duration-200",
                "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                errors.confirmPassword ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
              )}
              aria-invalid={!!errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted transition-colors hover:text-content-primary"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.confirmPassword.message}
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
              Resetting password...
            </>
          ) : (
            <>
              <Lock size={18} />
              Reset password
            </>
          )}
        </button>
      </form>
    </div>
  )
}
