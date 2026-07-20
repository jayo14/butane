"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { cn, getInitials } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"
import { useDisclosure } from "@/hooks/use-disclosure"
import { NAV_ITEMS, APP_NAME } from "@/lib/constants"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { CommandPalette } from "./command-palette"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  User,
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
  user: <User size={20} />,
  settings: <Settings size={20} />,
}

export function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { isOpen, onToggle, onClose } = useDisclosure(false)
  const { collapsed } = useSidebar()
  const { user } = useAuth()

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role as "admin" | "teacher"))),
    [user],
  )

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-border-primary", collapsed ? "justify-center px-2" : "gap-3 px-5")}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
          <GraduationCap size={20} />
        </div>
        {!collapsed && (
          <>
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
          </>
        )}
      </div>

      {!collapsed && (
        <div className="border-b border-border-primary px-4 py-3">
          <CommandPalette />
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onClose()}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center rounded-xl transition-all duration-200",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/10 font-semibold"
                  : "text-content-muted hover:bg-surface-secondary hover:text-content-primary font-medium",
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={cn("shrink-0 transition-all duration-200", isActive && "scale-110 text-primary")}>
                {iconMap[item.icon]}
              </span>
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge != null && (
                    <span className="ml-auto rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border-primary p-3">
        {collapsed ? (
          <Link
            href="/dashboard/profile"
            onClick={() => isMobile && onClose()}
            className="flex justify-center"
            title={user ? user.full_name : "Profile"}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-white shadow-sm">
              {user ? getInitials(user.full_name) : "AU"}
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/profile"
            onClick={() => isMobile && onClose()}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/[0.02] border border-primary/10 px-4 py-3 transition-all duration-300 hover:from-primary/10 hover:to-primary/5 hover:shadow-sm hover:shadow-primary/10"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-white shadow-sm shadow-primary/20">
              {user ? getInitials(user.full_name) : "AU"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-content-primary">
                {user ? user.full_name : "User"}
              </p>
              <p className="truncate text-xs text-content-muted">
                {user ? user.email : ""}
              </p>
            </div>
          </Link>
        )}
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
          "flex flex-col border-r border-border-primary bg-white transition-all duration-300",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 z-50 w-72 shadow-xl transition-all duration-300 ease-out",
                isOpen ? "translate-x-0" : "-translate-x-full",
              )
            : collapsed ? "w-16 shrink-0" : "w-64 shrink-0",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
