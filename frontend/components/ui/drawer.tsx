"use client"

import { useEffect, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DrawerPlacement, Size } from "@/types"

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  placement?: DrawerPlacement
  size?: Size | "xl" | "full"
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
}

const placementStyles: Record<DrawerPlacement, string> = {
  left: "left-0 top-0 h-full",
  right: "right-0 top-0 h-full",
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  placement = "right",
  size = "md",
}: DrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed flex flex-col bg-white shadow-drawer",
          "animate-in slide-in-from-right duration-300",
          sizeStyles[size],
          placementStyles[placement],
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border-primary px-6 py-4">
            <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border-primary px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
