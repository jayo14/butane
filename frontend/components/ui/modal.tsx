"use client"

import { useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100%-2rem)] mx-4",
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => closeOnOverlayClick && onClose()}
      />
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 w-full rounded-2xl bg-white shadow-modal",
          "max-h-[85vh] overflow-y-auto",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeStyles[size],
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b border-border-primary px-6 py-4">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-content-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-0.5 text-sm text-content-secondary">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-4 flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border-primary px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
