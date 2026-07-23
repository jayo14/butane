"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, CheckCircle, X } from "lucide-react"
import { api, ApiNotification } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.notifications.list({ page_size: 50 })
      setNotifications(res.results)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-content-muted">Loading notifications...</p>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Notifications</h1>
          <p className="mt-1 text-sm text-content-muted">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <CheckCircle size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Bell size={40} className="mb-4 text-content-muted/30" />
          <p className="text-sm text-content-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 rounded-2xl border border-border-primary p-4 transition-colors",
                !n.is_read && "bg-primary/[0.02]",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-content-primary">{n.message}</p>
                <p className="mt-1 text-xs text-content-muted">
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="shrink-0 rounded-lg p-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
