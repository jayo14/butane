"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"
import { useDisclosure } from "@/hooks/use-disclosure"
import { NAV_ITEMS, APP_NAME } from "@/lib/constants"
import { CommandPalette } from "./command-palette"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  GraduationCap,
  X,
  PanelLeftClose,
  PanelLeft,
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
      <div className="flex h-16 items-center gap-3 border-b border-border-primary px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
          <GraduationCap size={20} />
        </div>
        <span className="text-base font-semibold text-content-primary">{APP_NAME}</span>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="border-b border-border-primary px-4 py-3">
        <CommandPalette />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onClose()}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-content-muted hover:bg-surface-secondary hover:text-content-primary",
              )}
            >
              <span className={cn("shrink-0 transition-transform duration-150", isActive && "scale-110")}>
                {iconMap[item.icon]}
              </span>
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

      <div className="border-t border-border-primary p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-secondary px-3 py-2.5 transition-colors hover:bg-surface-secondary/80">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-white shadow-sm">
            AU
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content-primary">Admin User</p>
            <p className="truncate text-xs text-content-muted">admin@deesoar.edu</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {isMobile && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "fixed z-50 flex size-10 items-center justify-center rounded-xl border border-border-primary bg-white shadow-card transition-all duration-200",
            isOpen ? "left-[calc(18rem-3.25rem)] top-4" : "left-4 top-4",
          )}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
        </button>
      )}

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 animate-in fade-in duration-200 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-border-primary bg-white",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 z-50 w-72 shadow-xl transition-all duration-300 ease-out",
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
