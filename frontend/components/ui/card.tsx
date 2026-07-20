import { memo } from "react"
import type { MemoExoticComponent } from "react"
import { cn } from "@/lib/utils"
import type { BaseComponentProps } from "@/types"

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-7",
}

interface CardProps extends BaseComponentProps {
  padding?: keyof typeof paddingStyles
  bordered?: boolean
  shadow?: "none" | "sm" | "md" | "lg"
  hover?: boolean
  interactive?: boolean
  gradient?: boolean
  style?: React.CSSProperties
}

const shadowStyles = {
  none: "shadow-none",
  sm: "shadow-card",
  md: "shadow-dropdown",
  lg: "shadow-modal",
}

interface CardComponent extends MemoExoticComponent<typeof CardInner> {
  Header: typeof CardHeader
  Content: typeof CardContent
}

function CardInner({
  children,
  className,
  padding = "md",
  bordered = true,
  shadow = "sm",
  hover = false,
  interactive = false,
  gradient = false,
  style,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white transition-all duration-300",
        bordered && "border border-border-primary/60",
        shadowStyles[shadow],
        hover && "hover:-translate-y-1 hover:shadow-dropdown",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-dropdown active:translate-y-0 active:shadow-card",
        gradient && "bg-gradient-to-br from-white to-surface-secondary/50",
        paddingStyles[padding],
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}

export const Card = memo(CardInner) as unknown as CardComponent

interface CardHeaderProps extends BaseComponentProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function CardHeader({ title, description, action, className, children }: CardHeaderProps) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        {title && <h3 className="text-lg font-bold text-content-primary">{title}</h3>}
        {description && <p className="mt-1 text-sm text-content-secondary leading-relaxed">{description}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface CardContentProps extends BaseComponentProps {
  padding?: boolean
}

export function CardContent({ children, className, padding = true }: CardContentProps) {
  return (
    <div className={cn(padding && "px-7 pb-7", className)}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
