"use client"

import { forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ButtonVariant, Size } from "@/types"

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20",
  secondary:
    "bg-dark text-white hover:bg-dark/90 shadow-sm",
  outline:
    "border-2 border-border-primary bg-white text-content-primary hover:bg-surface-secondary hover:border-primary/40",
  ghost:
    "text-content-primary hover:bg-surface-secondary hover:text-primary",
  danger:
    "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm shadow-danger/20",
}

const sizeStyles: Record<Size, string> = {
  sm: "h-10 px-4 text-xs gap-1.5",
  md: "h-12 px-6 text-sm gap-2",
  lg: "h-14 px-8 text-base gap-2.5",
}

const iconSizeStyles: Record<Size, string> = {
  sm: "size-9 p-0",
  md: "size-11 p-0",
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
          "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200",
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
