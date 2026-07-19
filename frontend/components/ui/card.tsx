import { memo } from "react"
import type { MemoExoticComponent } from "react"
import { cn } from "@/lib/utils"
import type { BaseComponentProps } from "@/types"

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
}

interface CardProps extends BaseComponentProps {
  padding?: keyof typeof paddingStyles
  bordered?: boolean
  shadow?: "none" | "sm" | "md" | "lg"
  style?: React.CSSProperties
}

const shadowStyles = {
  none: "shadow-none",
  sm: "shadow-card",
  md: "shadow-card md:shadow-dropdown",
  lg: "shadow-card md:shadow-modal",
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
  style,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white",
        bordered && "border border-border-primary",
        shadowStyles[shadow],
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
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        {title && <h3 className="text-lg font-semibold text-content-primary">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-content-secondary">{description}</p>}
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
    <div className={cn(padding && "px-6 pb-6", className)}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
