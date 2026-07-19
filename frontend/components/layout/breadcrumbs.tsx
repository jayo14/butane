"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants"

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumbs() {
  const pathname = usePathname()

  if (pathname === "/dashboard") return null

  const segments = pathname.split("/").filter(Boolean)

  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/dashboard" }]

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    const href = "/" + segments.slice(0, i + 1).join("/")
    const navItem = NAV_ITEMS.find((n) => n.href === href)
    items.push({
      label: navItem?.label ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href,
    })
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-content-muted">
        <li>
          <Link
            href="/dashboard"
            className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-surface-secondary hover:text-content-primary"
          >
            <Home size={15} />
          </Link>
        </li>
        {items.slice(1).map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-content-muted/50" />
            {i < items.length - 2 ? (
              <Link
                href={item.href}
                className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-surface-secondary hover:text-content-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn("rounded-md px-1.5 py-0.5 text-content-primary")}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
