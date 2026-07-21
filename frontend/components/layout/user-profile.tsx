"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Settings, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export function UserProfile() {
  const router = useRouter()
  const { user, logout } = useAuth()
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
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      menuRef.current?.focus()
    }
  }, [isOpen])

  async function handleLogout() {
    setIsOpen(false)
    await logout()
    router.push("/login")
  }

  const initials = user ? getInitials(user.full_name) : "U"
  const displayName = user ? user.full_name : "User"
  const displayEmail = user ? user.email : ""
  const shortName = user ? (user.first_name || user.full_name.split(" ")[0] || "User") : "User"

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
          {initials}
        </div>
        <span className="hidden text-sm font-medium text-content-primary md:block">{shortName}</span>
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
          tabIndex={-1}
          role="menu"
          className="absolute right-0 top-full z-[9999] mt-2 w-56 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-dropdown">
            <div className="border-b border-border-primary px-4 py-3">
              <p className="text-sm font-medium text-content-primary">{displayName}</p>
              <p className="text-xs text-content-secondary">{displayEmail}</p>
            </div>

            <div className="p-1.5">
              <Link
                href="/dashboard/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-content-primary transition-colors hover:bg-surface-secondary"
              >
                <User size={16} className="text-content-muted" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                role="menuitem"
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
                role="menuitem"
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
