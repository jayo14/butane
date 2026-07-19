"use client"

import { useState, useCallback } from "react"
import type { Toast, ToastVariant } from "@/types"
import { randomId } from "@/lib/utils"

interface AddToastOptions {
  message: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

const DEFAULT_DURATION = 4000

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((options: AddToastOptions) => {
    const toast: Toast = {
      id: randomId(),
      message: options.message,
      description: options.description,
      variant: options.variant ?? "info",
      duration: options.duration ?? DEFAULT_DURATION,
    }

    setToasts((prev) => [...prev, toast])

    const duration = toast.duration ?? DEFAULT_DURATION
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, duration)
    }

    return toast.id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return { toasts, addToast, removeToast, clearToasts }
}
