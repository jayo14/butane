"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Settings, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"

export function UserProfile() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleLogout() {
    setIsOpen(false)
    router.push("/login")
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-surface-secondary"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {getInitials("Admin User")}
        </div>
        <span className="hidden text-sm font-medium text-content-primary md:block">Admin</span>
        <ChevronDown
          size={16}
          className={cn(
            "hidden text-content-muted transition-transform duration-200 md:block",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-2 w-56 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-dropdown">
            <div className="border-b border-border-primary px-4 py-3">
              <p className="text-sm font-medium text-content-primary">Admin User</p>
              <p className="text-xs text-content-secondary">admin@deesoar.edu</p>
            </div>

            <div className="p-1.5">
              <Link
                href="/dashboard/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-content-primary transition-colors hover:bg-surface-secondary"
              >
                <User size={16} className="text-content-muted" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-content-primary transition-colors hover:bg-surface-secondary"
              >
                <Settings size={16} className="text-content-muted" />
                Settings
              </Link>
            </div>

            <div className="border-t border-border-primary p-1.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-light"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
