"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"
import { Bell, Search } from "lucide-react"
import { NAV_ITEMS } from "@/lib/constants"

export function Header() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const currentItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href))

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-4 border-b border-border-primary bg-white px-4 md:px-6",
        isMobile && "pl-16",
      )}
    >
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-content-primary">
          {currentItem?.label || "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  )
}
