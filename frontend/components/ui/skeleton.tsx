import { memo } from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular" | "card"
  width?: string | number
  height?: string | number
  count?: number
}

const variantStyles = {
  text: "h-4 w-full rounded",
  circular: "rounded-full",
  rectangular: "rounded-lg",
  card: "h-32 w-full rounded-xl",
}

export const Skeleton = memo(function Skeleton({
  className,
  variant = "text",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const elements = Array.from({ length: count })

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-surface-secondary",
            variantStyles[variant],
            className,
          )}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  )
})

interface SkeletonGroupProps {
  children: React.ReactNode
  isLoading: boolean
  skeleton?: React.ReactNode
}

export const SkeletonGroup = memo(function SkeletonGroup({ children, isLoading, skeleton }: SkeletonGroupProps) {
  if (isLoading) {
    return <>{skeleton || <Skeleton variant="card" />}</>
  }
  return <>{children}</>
})
