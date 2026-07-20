import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + "..."
}

export function randomId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "success",
    inactive: "warning",
    suspended: "danger",
    draft: "info",
    scheduled: "info",
    ongoing: "warning",
    completed: "success",
    cancelled: "danger",
    archived: "warning",
  }
  return map[status.toLowerCase()] ?? "primary"
}
