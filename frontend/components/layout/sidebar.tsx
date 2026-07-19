"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"
import { useDisclosure } from "@/hooks/use-disclosure"
import { NAV_ITEMS, APP_NAME } from "@/lib/constants"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  GraduationCap,
  X,
} from "lucide-react"

const iconMap: Record<string, React.ReactNode> = {
  "layout-dashboard": <LayoutDashboard size={20} />,
  users: <Users size={20} />,
  "book-open": <BookOpen size={20} />,
  "clipboard-list": <ClipboardList size={20} />,
  "bar-chart-3": <BarChart3 size={20} />,
  settings: <Settings size={20} />,
}

export function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { isOpen, onToggle, onClose } = useDisclosure(false)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border-primary px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap size={20} />
        </div>
        <span className="text-base font-semibold text-content-primary">{APP_NAME}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onClose()}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-content-muted hover:bg-surface-secondary hover:text-content-primary",
              )}
            >
              <span className="shrink-0">{iconMap[item.icon]}</span>
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border-primary p-4">
        <div className="flex items-center gap-3 rounded-lg bg-surface-secondary px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            DS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content-primary">Admin User</p>
            <p className="truncate text-xs text-content-secondary">admin@deesoar.edu</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 flex size-10 items-center justify-center rounded-xl border border-border-primary bg-white shadow-card"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border-primary bg-white",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200",
                isOpen ? "translate-x-0" : "-translate-x-full",
              )
            : "w-64 shrink-0",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
