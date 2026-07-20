"use client"

import {
  Dropdown as HeroDropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/react"
import type { ButtonVariant, Size } from "@/types"
import { ChevronDown } from "lucide-react"
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
  variant?: ButtonVariant
  size?: Size
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
  const sizeClasses = { sm: "h-8 px-3 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-base gap-2.5" }
  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
    secondary: "bg-content-primary text-white hover:bg-content-primary/90 shadow-sm",
    outline: "border border-border-primary bg-white text-content-primary hover:bg-surface-secondary",
    ghost: "text-content-primary hover:bg-surface-secondary",
    danger: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm",
  }
  return (
    <HeroDropdown>
      <DropdownTrigger>
        {trigger || (
          <span
            className={cn(
              "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none",
              "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              variantClasses[variant],
              sizeClasses[size],
            )}
          >
            {label}
            <ChevronDown size={size === "sm" ? 14 : 16} />
          </span>
        )}
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Dropdown menu"
        onAction={(key) => onAction(key as string)}
        className="min-w-[180px] rounded-xl border border-border-primary bg-white p-1 shadow-dropdown"
      >
        {items.map((item) => 
          item.divider ? (
            <DropdownItem key={item.key} className="h-px bg-border-primary my-1" />
          ) : (
            <DropdownItem
              key={item.key}
              className={cn(
                "rounded-lg px-3 py-2 text-sm text-content-primary",
                "data-[focused=true]:bg-surface-secondary data-[hover=true]:bg-surface-secondary",
                item.danger && "text-danger data-[focused=true]:bg-danger-light data-[hover=true]:bg-danger-light",
              )}
            >
              {item.icon && <span className="mr-2 shrink-0">{item.icon}</span>}
              {item.label}
            </DropdownItem>
          )
        )}
      </DropdownMenu>
    </HeroDropdown>
  )
}
