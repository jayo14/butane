"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"],
  })

type ChangePasswordData = z.infer<typeof changePasswordSchema>

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setFocus,
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
  })

  if (!isOpen) return null

  async function onSubmit(data: ChangePasswordData) {
    setSubmitError(null)
    setSuccess(false)
    try {
      await api.auth.changePassword(data.oldPassword, data.newPassword)
      setSuccess(true)
      reset()
      setTimeout(onClose, 2000)
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to change password")
      setFocus("oldPassword")
    }
  }

  function handleClose() {
    reset()
    setSubmitError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-dropdown"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock size={20} />
            </div>
            <div>
              <h2 id="change-password-title" className="text-lg font-semibold text-content-primary">
                Change Password
              </h2>
              <p className="text-xs text-content-muted">Update your account password</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success-light p-3 text-sm text-success">
            <CheckCircle2 size={16} className="shrink-0" />
            Password updated successfully
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {submitError && !success && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">
              <AlertCircle size={16} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-primary">Current Password</label>
            <div className="relative">
              <input
                {...register("oldPassword")}
                type={showOld ? "text" : "password"}
                autoComplete="current-password"
                className={cn(
                  "block w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-content-primary placeholder:text-content-secondary md:py-2.5",
                  "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                  errors.oldPassword ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
                )}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                tabIndex={-1}
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="mt-1 text-xs text-danger">{errors.oldPassword.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-primary">New Password</label>
            <div className="relative">
              <input
                {...register("newPassword")}
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                className={cn(
                  "block w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-content-primary placeholder:text-content-secondary md:py-2.5",
                  "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                  errors.newPassword ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
                )}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-primary">Confirm New Password</label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                className={cn(
                  "block w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-content-primary placeholder:text-content-secondary md:py-2.5",
                  "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                  errors.confirmPassword ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-border-primary px-4 py-2.5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
