"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Check, X, AlertTriangle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RosterRow } from "@/types"

interface RosterReviewTableProps {
  newRows: RosterRow[]
  duplicateRows: RosterRow[]
  onAccept: (row: RosterRow) => void
  onSkip: (row: RosterRow) => void
  onAcceptAll: () => void
  acceptedCount: number
  skippedCount: number
  className?: string
}

type RowStatus = "pending" | "accepted" | "skipped"

interface ReviewRow extends RosterRow {
  status: RowStatus
  isDuplicate: boolean
}

export function RosterReviewTable({
  newRows,
  duplicateRows,
  onAccept,
  onSkip,
  onAcceptAll,
  acceptedCount,
  skippedCount,
  className,
}: RosterReviewTableProps) {
  const [rows, setRows] = useState<ReviewRow[]>(() => [
    ...newRows.map((r) => ({ ...r, status: "pending" as RowStatus, isDuplicate: false })),
    ...duplicateRows.map((r) => ({ ...r, status: "pending" as RowStatus, isDuplicate: true })),
  ])
  const [focusedIndex, setFocusedIndex] = useState(0)
  const tableRef = useRef<HTMLTableSectionElement>(null)

  const handleAccept = useCallback(
    (row: ReviewRow) => {
      setRows((prev) =>
        prev.map((r) => (r.index === row.index ? { ...r, status: "accepted" } : r)),
      )
      onAccept(row)
    },
    [onAccept],
  )

  const handleSkip = useCallback(
    (row: ReviewRow) => {
      setRows((prev) =>
        prev.map((r) => (r.index === row.index ? { ...r, status: "skipped" } : r)),
      )
      onSkip(row)
    },
    [onSkip],
  )

  const handleAcceptAll = useCallback(() => {
    setRows((prev) =>
      prev.map((r) => (r.status === "pending" ? { ...r, status: "accepted" } : r)),
    )
    onAcceptAll()
  }, [onAcceptAll])

  // Keyboard navigation
  useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableButtons = table.querySelectorAll<HTMLElement>(
        "button[data-action]",
      )
      if (!focusableButtons.length) return

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault()
        const next = Math.min(focusedIndex + 1, focusableButtons.length - 1)
        setFocusedIndex(next)
        focusableButtons[next]?.focus()
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault()
        const prev = Math.max(focusedIndex - 1, 0)
        setFocusedIndex(prev)
        focusableButtons[prev]?.focus()
      } else if (e.key === "a" || e.key === "A") {
        const focused = document.activeElement
        if (focused instanceof HTMLElement && focused.dataset.action === "accept") {
          focused.click()
        }
      } else if (e.key === "s" || e.key === "S") {
        const focused = document.activeElement
        if (focused instanceof HTMLElement && focused.dataset.action === "skip") {
          focused.click()
        }
      }
    }

    table.addEventListener("keydown", handleKeyDown)
    return () => table.removeEventListener("keydown", handleKeyDown)
  }, [focusedIndex])

  const pendingRows = rows.filter((r) => r.status === "pending")
  const totalRows = rows.length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-content-primary">
            {pendingRows.length} of {totalRows} pending
          </span>
          <span className="text-content-muted">
            {acceptedCount} accepted · {skippedCount} skipped
          </span>
        </div>
        <button
          type="button"
          onClick={handleAcceptAll}
          disabled={pendingRows.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={14} />
          Accept All ({pendingRows.length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-primary">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-primary">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Email
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody ref={tableRef} className="divide-y divide-border-primary bg-white">
              {rows.map((row) => (
                <tr
                  key={row.index}
                  className={cn(
                    "transition-colors",
                    row.status === "accepted" && "bg-green-50",
                    row.status === "skipped" && "bg-gray-50 opacity-60",
                    row.isDuplicate && row.status === "pending" && "bg-amber-50",
                  )}
                >
                  <td className="px-4 py-3">
                    {row.status === "accepted" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        <Check size={12} />
                        Accepted
                      </span>
                    )}
                    {row.status === "skipped" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        <X size={12} />
                        Skipped
                      </span>
                    )}
                    {row.status === "pending" && row.isDuplicate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        <AlertTriangle size={12} />
                        Duplicate
                      </span>
                    )}
                    {row.status === "pending" && !row.isDuplicate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        New
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-content-primary">
                    {row.full_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-content-secondary">
                    {row.guardian_phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-content-secondary">
                    {row.guardian_email || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          data-action="accept"
                          onClick={() => handleAccept(row)}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
                          aria-label={`Accept ${row.full_name}`}
                        >
                          <Check size={12} />
                          Accept
                        </button>
                        <button
                          type="button"
                          data-action="skip"
                          onClick={() => handleSkip(row)}
                          className="flex items-center gap-1 rounded-lg border border-border-primary px-2 py-1 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-secondary"
                          aria-label={`Skip ${row.full_name}`}
                        >
                          <X size={12} />
                          Skip
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-content-muted">
        Keyboard: <kbd className="rounded border border-border-primary bg-surface-secondary px-1 py-0.5 text-[10px]">↑</kbd>{ " " }
        <kbd className="rounded border border-border-primary bg-surface-secondary px-1 py-0.5 text-[10px]">↓</kbd> navigate ·{ " " }
        <kbd className="rounded border border-border-primary bg-surface-secondary px-1 py-0.5 text-[10px]">A</kbd> accept ·{ " " }
        <kbd className="rounded border border-border-primary bg-surface-secondary px-1 py-0.5 text-[10px]">S</kbd> skip
      </p>
    </div>
  )
}
