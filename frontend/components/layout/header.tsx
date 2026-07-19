"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"
import { Search, Command } from "lucide-react"
import { NAV_ITEMS } from "@/lib/constants"
import { Breadcrumbs } from "./breadcrumbs"
import { NotificationPanel } from "./notification-panel"
import { UserProfile } from "./user-profile"

export function Header() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  const currentItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href))

  if (showMobileSearch) {
    return (
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border-primary bg-white px-4">
        <div className="relative flex flex-1 items-center">
          <Search size={18} className="absolute left-3 text-content-muted" />
          <input
            autoFocus
            type="text"
            placeholder="Search pages..."
            className="h-10 w-full rounded-xl border border-border-primary bg-surface-secondary pl-10 pr-4 text-sm text-content-primary placeholder:text-content-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            onBlur={() => setShowMobileSearch(false)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowMobileSearch(false)}
          className="shrink-0 text-sm font-medium text-content-muted transition-colors hover:text-content-primary"
        >
          Cancel
        </button>
      </header>
    )
  }

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-4 border-b border-border-primary bg-white px-4 md:px-6",
        isMobile && "pl-16",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="truncate text-lg font-semibold text-content-primary">
          {currentItem?.label || "Dashboard"}
        </h1>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {!isMobile && (
          <button
            type="button"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                metaKey: true,
                key: "k",
              })
              document.dispatchEvent(event)
            }}
            className="hidden h-9 items-center gap-2 rounded-xl border border-border-primary bg-surface-secondary px-3 text-sm text-content-muted transition-colors hover:border-content-muted/30 hover:text-content-secondary lg:flex"
            aria-label="Open command palette"
          >
            <Search size={16} />
            <span className="text-left">Search...</span>
            <kbd className="flex items-center gap-0.5 rounded-md border border-border-primary bg-white px-1.5 py-0.5 text-[10px] font-medium text-content-muted">
              <Command size={11} />
              K
            </kbd>
          </button>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={() => setShowMobileSearch(true)}
            className="flex size-10 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        )}

        <NotificationPanel />
        <UserProfile />
      </div>
    </header>
  )
}
