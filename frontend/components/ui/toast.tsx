"use client"

import { createContext, useContext, useCallback } from "react"
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToastState } from "@/hooks/use-toast"
import type { Toast as ToastType, ToastVariant } from "@/types"

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-l-success bg-success-light/50",
  error: "border-l-danger bg-danger-light/50",
  warning: "border-l-warning bg-warning-light/50",
  info: "border-l-info bg-info-light/50",
}

const iconColorStyles: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-info",
}

interface ToastContextType {
  toasts: ToastType[]
  addToast: (options: {
    message: string
    description?: string
    variant?: ToastVariant
    duration?: number
  }) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, addToast, removeToast, clearToasts } = useToastState()

  const contextValue: ToastContextType = {
    toasts,
    addToast: useCallback(
      (options) => addToast(options),
      [addToast],
    ),
    removeToast,
    clearToasts,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex w-80 items-start gap-3 rounded-xl border border-border-primary bg-white p-4 shadow-dropdown",
              "animate-in slide-in-from-right fade-in duration-300",
              "border-l-4",
              variantStyles[toast.variant],
            )}
            role="alert"
          >
            <span className={cn("mt-0.5 shrink-0", iconColorStyles[toast.variant])}>
              {iconMap[toast.variant]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-content-primary">{toast.message}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-content-secondary">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 text-content-muted transition-colors hover:text-content-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
