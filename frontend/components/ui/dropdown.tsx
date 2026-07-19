"use client"

import {
  Dropdown as HeroDropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react"
import type { ButtonVariant, Size } from "@/types"
import { Button } from "./button"
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
  return (
    <HeroDropdown>
      <DropdownTrigger>
        {trigger || (
          <Button
            variant={variant}
            size={size}
            rightIcon={<ChevronDown size={size === "sm" ? 14 : 16} />}
            isLoading={isLoading}
            disabled={disabled}
          >
            {label}
          </Button>
        )}
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Dropdown menu"
        onAction={(key) => onAction(key as string)}
        className="min-w-[180px] rounded-xl border border-border-primary bg-white p-1 shadow-dropdown"
      >
        {items.map((item) => (
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
        ))}
      </DropdownMenu>
    </HeroDropdown>
  )
}
