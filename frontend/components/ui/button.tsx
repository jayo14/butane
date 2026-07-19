"use client"

import { forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ButtonVariant, Size } from "@/types"

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary:
    "bg-content-primary text-white hover:bg-content-primary/90 shadow-sm",
  outline:
    "border border-border-primary bg-white text-content-primary hover:bg-surface-secondary",
  ghost:
    "text-content-primary hover:bg-surface-secondary",
  danger:
    "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm",
}

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
}

const iconSizeStyles: Record<Size, string> = {
  sm: "size-7 p-0",
  md: "size-10 p-0",
  lg: "size-12 p-0",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: Size
  isLoading?: boolean
  isIconOnly?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      isIconOnly = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "select-none",
          variantStyles[variant],
          isIconOnly ? iconSizeStyles[size] : sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === "sm" ? 14 : size === "lg" ? 20 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        {!isIconOnly && children}
        {!isLoading && !isIconOnly && rightIcon}
      </button>
    )
  },
)

Button.displayName = "Button"
