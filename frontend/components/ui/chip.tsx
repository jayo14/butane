"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BadgeVariant, Size } from "@/types"

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  mint: "bg-mint/30 text-content-primary",
  pink: "bg-baby-pink/50 text-content-primary",
}

const sizeStyles: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3 py-1.5 text-sm gap-1.5",
}

interface ChipProps {
  variant?: BadgeVariant
  size?: Size
  children: React.ReactNode
  onClose?: () => void
  className?: string
  icon?: React.ReactNode
}

export function Chip({
  variant = "primary",
  size = "md",
  children,
  onClose,
  className,
  icon,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          aria-label="Remove"
        >
          <X size={size === "sm" ? 10 : size === "lg" ? 14 : 12} />
        </button>
      )}
    </span>
  )
}
