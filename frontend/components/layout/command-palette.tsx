"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Command, ArrowRight, LayoutDashboard, Users, BookOpen, ClipboardList, BarChart3, Settings, FileText, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { NAV_ITEMS } from "@/lib/constants"

const extraCommands = [
  { label: "View Results", href: "/dashboard/results", icon: "bar-chart-3" },
  { label: "Create Exam", href: "/dashboard/exams", icon: "clipboard-list" },
  { label: "Add Student", href: "/dashboard/students", icon: "users" },
]

export function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")

  const allItems = [
    ...NAV_ITEMS.map((n) => ({ label: n.label, href: n.href, icon: n.icon })),
    ...extraCommands,
  ]

  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems

  const openPalette = useCallback(() => {
    setIsOpen(true)
    setQuery("")
  }, [])

  const closePalette = useCallback(() => {
    setIsOpen(false)
    setQuery("")
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        isOpen ? closePalette() : openPalette()
      }
      if (e.key === "Escape" && isOpen) closePalette()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, openPalette, closePalette])

  function handleSelect(href: string) {
    closePalette()
    router.push(href)
  }

  function getIcon(iconName: string) {
    const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
      "layout-dashboard": LayoutDashboard,
      users: Users,
      "book-open": BookOpen,
      "clipboard-list": ClipboardList,
      "bar-chart-3": BarChart3,
      settings: Settings,
    }
    return icons[iconName] || GraduationCap
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-xl border border-border-primary bg-surface-secondary px-3 text-sm text-content-muted transition-colors hover:border-content-muted/30 hover:text-content-secondary"
        aria-label="Open command palette"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Search pages...</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-border-primary bg-white px-1.5 py-0.5 text-[10px] font-medium text-content-muted sm:flex">
          <Command size={11} />
          K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePalette} />

          <div className="fixed left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2">
            <div className="animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-modal">
                <div className="flex items-center gap-3 border-b border-border-primary px-4">
                  <Search size={18} className="text-content-muted" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pages..."
                    className="h-12 flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-secondary focus:outline-none"
                  />
                  <kbd className="rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] text-content-muted">
                    ESC
                  </kbd>
                </div>

                <div className="max-h-72 overflow-y-auto p-2">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-sm text-content-muted">
                      <Search size={24} className="mb-2 opacity-40" />
                      No results for &quot;{query}&quot;
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filtered.map((item) => {
                        const IconComponent = getIcon(item.icon)
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => handleSelect(item.href)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-content-primary transition-colors hover:bg-surface-secondary"
                          >
                            <IconComponent size={18} className="text-content-muted" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ArrowRight size={14} className="text-content-muted opacity-0 group-hover:opacity-100" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
