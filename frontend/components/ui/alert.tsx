"use client"

import { useState } from "react"
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AlertVariant } from "@/types"

const variantStyles: Record<AlertVariant, string> = {
  info: "border-info/20 bg-info-light text-info",
  success: "border-success/20 bg-success-light text-success",
  warning: "border-warning/20 bg-warning-light text-warning",
  error: "border-danger/20 bg-danger-light text-danger",
}

const iconMap: Record<AlertVariant, React.ReactNode> = {
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <AlertCircle size={18} />,
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  isDismissible?: boolean
  onClose?: () => void
  icon?: React.ReactNode
  className?: string
}

export function Alert({
  variant = "info",
  title,
  children,
  isDismissible = false,
  onClose,
  icon,
  className,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function handleClose() {
    setDismissed(true)
    onClose?.()
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{icon ?? iconMap[variant]}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="mb-0.5 text-sm font-medium">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {isDismissible && (
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
