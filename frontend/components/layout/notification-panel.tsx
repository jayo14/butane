"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, X, CheckCircle, AlertTriangle, Info, Calendar, FileText, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "exam" | "grade" | "enrollment"
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  { id: "1", type: "exam", title: "Exam Scheduled", message: "Algebra I Midterm scheduled for Oct 15", time: "5 min ago", read: false },
  { id: "2", type: "success", title: "Results Published", message: "Biology Chapter 5 results are available", time: "1 hour ago", read: false },
  { id: "3", type: "warning", title: "Low Pass Rate", message: "Physics quiz has a 62% pass rate", time: "3 hours ago", read: true },
  { id: "4", type: "enrollment", title: "New Student", message: "Evelyn Brown enrolled in SSS1", time: "1 day ago", read: true },
]

const iconMap: Record<string, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-success" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  info: <Info size={18} className="text-info" />,
  exam: <Calendar size={18} className="text-primary" />,
  grade: <FileText size={18} className="text-primary" />,
  enrollment: <Users size={18} className="text-primary" />,
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

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

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
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
              {notifications.length === 0 ? (
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
                        !n.read && "bg-primary/[0.02]",
                      )}
                    >
                      <span className="mt-0.5 shrink-0">{iconMap[n.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-content-primary">{n.title}</p>
                        <p className="mt-0.5 text-xs text-content-secondary">{n.message}</p>
                        <p className="mt-1 text-[10px] text-content-muted">{n.time}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissNotification(n.id)}
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
