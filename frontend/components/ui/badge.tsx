import { memo } from "react"
import { cn } from "@/lib/utils"
import type { BadgeVariant, Size } from "@/types"

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  mint: "bg-mint/20 text-mint-foreground",
  pink: "bg-baby-pink text-baby-pink-foreground",
}

const sizeStyles: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[11px] leading-4",
  md: "px-2.5 py-1 text-xs leading-5",
  lg: "px-3 py-1.5 text-sm leading-5",
}

interface BadgeProps {
  variant?: BadgeVariant
  size?: Size
  children: React.ReactNode
  className?: string
}

export const Badge = memo(function Badge({ variant = "primary", size = "md", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  )
})
