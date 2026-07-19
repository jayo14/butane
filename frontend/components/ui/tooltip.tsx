"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

type TooltipPlacement = "top" | "bottom" | "left" | "right"

interface TooltipProps {
  content: string
  children: React.ReactNode
  placement?: TooltipPlacement
  delay?: number
  className?: string
}

const placementStyles: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

export function Tooltip({
  content,
  children,
  placement = "top",
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  function handleMouseEnter() {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap",
            "rounded-lg bg-content-primary px-2.5 py-1.5 text-xs text-white shadow-dropdown",
            "animate-in fade-in zoom-in-95 duration-150",
            placementStyles[placement],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
