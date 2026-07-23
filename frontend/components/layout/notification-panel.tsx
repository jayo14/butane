"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bell, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { api, ApiNotification } from "@/lib/api"

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.notifications.list({ page_size: 20 })
      setNotifications(res.results)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function markAllRead() {
    try {
      await api.notifications.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      // silently fail
    }
  }

  async function markRead(id: string) {
    try {
      await api.notifications.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
    } catch {
      // silently fail
    }
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex size-10 items-center justify-center rounded-xl text-content-muted transition-all hover:bg-surface-secondary hover:text-content-primary"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-[9999] mt-2 w-80 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-dropdown">
            <div className="flex items-center justify-between border-b border-border-primary px-4 py-3">
              <span className="text-sm font-semibold text-content-primary">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-content-muted">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Bell size={24} className="mb-2 text-content-muted/40" />
                  <p className="text-sm text-content-muted">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border-primary">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-secondary",
                        !n.is_read && "bg-primary/[0.02]",
                      )}
                    >
                      <span className="mt-0.5 shrink-0">
                        <Info size={18} className="text-primary" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-content-primary">
                          {n.link ? (
                            <Link
                              href={n.link}
                              onClick={() => {
                                if (!n.is_read) markRead(n.id)
                                setIsOpen(false)
                              }}
                              className="hover:underline"
                            >
                              {n.message}
                            </Link>
                          ) : (
                            n.message
                          )}
                        </p>
                        <p className="mt-1 text-[10px] text-content-muted">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!n.is_read) markRead(n.id)
                          dismissNotification(n.id)
                        }}
                        className="shrink-0 rounded p-0.5 text-content-muted/50 transition-colors hover:text-content-primary"
                        aria-label="Dismiss notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="block border-t border-border-primary px-4 py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-surface-secondary hover:text-primary-hover"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
