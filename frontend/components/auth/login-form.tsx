"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const errorRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  useEffect(() => {
    if (submitError) {
      errorRef.current?.focus()
      setShakeKey((k) => k + 1)
    }
  }, [submitError])

  async function onSubmit(data: LoginFormData) {
    setSubmitError(null)
    try {
      await login(data.email, data.password)
      router.push("/dashboard")
    } catch (err: any) {
      const message = err?.message || "Invalid email or password. Please try again."
      setSubmitError(message)
      setFocus("email")
    }
  }

  const isDisabled = isSubmitting || authLoading

  return (
    <div className="py-8 md:py-10">
      <div className="mb-8 text-center lg:text-left">
        <div className="mx-auto lg:mx-0 mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/30">
          <LogIn size={28} />
        </div>
        <h1 className="text-3xl font-bold text-content-primary">Welcome back</h1>
        <p className="mt-2 text-base text-content-secondary">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {submitError && (
          <div
            key={shakeKey}
            ref={errorRef}
            tabIndex={-1}
            className="animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-danger/20 bg-danger-light p-4 text-sm text-danger shake-error"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-content-primary">
            Email address
          </label>
          <div className="relative">
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                "block w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-content-primary placeholder:text-content-secondary md:py-2.5",
                "transition-all duration-200",
                "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                errors.email ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-danger" />
            )}
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-danger animate-in fade-in" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-content-primary">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={cn(
                "block w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-content-primary placeholder:text-content-secondary md:py-2.5",
                "transition-all duration-200",
                "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                errors.password ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
              )}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
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
            <p id="password-error" className="mt-1.5 text-xs text-danger animate-in fade-in" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              {...register("rememberMe")}
              type="checkbox"
              className="size-4 rounded-md border-border-primary text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-content-secondary">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className={cn(
            "relative flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold text-white",
            "transition-all duration-200",
            "bg-primary hover:bg-primary-hover active:scale-[0.98] shadow-lg shadow-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          )}
        >
          {isDisabled ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Sign in
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-content-secondary">
        Don&apos;t have an account?{" "}
        <button type="button" className="font-medium text-primary transition-colors hover:text-primary-hover">
          Contact administrator
        </button>
      </p>
    </div>
  )
}
