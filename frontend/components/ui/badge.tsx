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
  sm: "px-1.5 py-0.5 text-[10px] leading-4",
  md: "px-2 py-0.5 text-[11px] leading-5",
  lg: "px-2.5 py-1 text-xs leading-5",
}

interface BadgeProps {
  variant?: BadgeVariant
  size?: Size
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = "primary", size = "md", children, className }: BadgeProps) {
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
}
