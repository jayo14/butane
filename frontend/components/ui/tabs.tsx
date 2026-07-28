import { memo } from "react"
import { cn } from "@/lib/utils"

interface Tab {
  label: string
  value: string
}

interface TabsProps {
  tabs: Tab[]
  value: string
  onChange: (value: string) => void
  className?: string
}

const activeStyles = "bg-white text-content-primary shadow-sm"
const inactiveStyles = "text-content-muted hover:text-content-primary"

export const Tabs = memo(function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn("inline-flex rounded-xl border border-border-primary bg-surface-secondary p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.value ? activeStyles : inactiveStyles,
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
})
