import { cn } from "@/lib/utils"
import type { ProgressVariant, Size } from "@/types"

const trackStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
}

const fillStyles: Record<ProgressVariant, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
}

interface ProgressProps {
  value?: number
  max?: number
  variant?: ProgressVariant
  size?: Size
  showLabel?: boolean
  label?: string
  isIndeterminate?: boolean
  className?: string
}

export function Progress({
  value = 0,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  isIndeterminate = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-sm font-medium text-content-primary">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-content-secondary">
              {isIndeterminate ? "..." : `${Math.round(percentage)}%`}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-secondary",
          trackStyles[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            fillStyles[variant],
            isIndeterminate && "animate-pulse",
          )}
          style={{ width: isIndeterminate ? "40%" : `${percentage}%` }}
        />
      </div>
    </div>
  )
}
