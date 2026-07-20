"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownAction {
  key: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  divider?: boolean
}

interface DropdownProps {
  trigger?: React.ReactNode
  label?: string
  variant?: string
  size?: "sm" | "md" | "lg"
  items: DropdownAction[]
  onAction: (key: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function Dropdown({
  trigger,
  label = "Menu",
  variant = "outline",
  size = "sm",
  items,
  onAction,
  isLoading,
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, close])

  const sizeClasses = { sm: "h-8 px-3 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-base gap-2.5" }
  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
    secondary: "bg-content-primary text-white hover:bg-content-primary/90 shadow-sm",
    outline: "border border-border-primary bg-white text-content-primary hover:bg-surface-secondary",
    ghost: "text-content-primary hover:bg-surface-secondary",
    danger: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm",
  }

  const triggerEl = trigger ? (
    <div
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {trigger}
    </div>
  ) : (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {label}
      <ChevronDown size={size === "sm" ? 14 : 16} />
    </span>
  )

  return (
    <div ref={containerRef} className="relative inline-flex">
      <div onClick={() => !disabled && !isLoading && setOpen((v) => !v)}>
        {triggerEl}
      </div>
      {open && !disabled && !isLoading && (
        <div
          className={cn(
            "absolute z-[9999] min-w-[180px] rounded-xl border border-border-primary bg-white p-1 shadow-dropdown",
            "animate-in fade-in slide-in-from-top-2 duration-200",
          )}
          style={{ top: "calc(100% + 6px)", right: 0, transformOrigin: "top right" }}
        >
          {items.map((item) =>
            item.divider ? (
              <div key={item.key} className="h-px bg-border-primary my-1" />
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onAction(item.key)
                  close()
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-surface-secondary",
                  item.danger && "text-danger hover:bg-danger-light",
                )}
              >
                {item.icon && <span className="mr-1.5 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
