"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Column } from "@/types"

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  isLoading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (item: T) => void
  sortable?: boolean
  striped?: boolean
  compact?: boolean
  className?: string
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyState,
  onRowClick,
  sortable: globallySortable = false,
  striped = true,
  compact = false,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (isLoading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border-primary", className)}>
        <div className="divide-y divide-border-primary">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex animate-pulse gap-4 p-4">
              {columns.map((col) => (
                <div key={col.key} className="h-4 flex-1 rounded bg-surface-secondary" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border-primary", className)}>
        {emptyState || (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-content-secondary">No data available</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border-primary", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-primary">
          <thead>
            <tr className="bg-surface-secondary">
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                const canSort = globallySortable && col.sortable !== false
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-muted",
                      compact && "px-3 py-2",
                      canSort && "cursor-pointer select-none hover:text-content-primary",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className,
                    )}
                    onClick={() => canSort && handleSort(col.key)}
                    scope="col"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {canSort && (
                        <>
                          {isSorted && sortDir === "asc" && <ChevronUp size={14} />}
                          {isSorted && sortDir === "desc" && <ChevronDown size={14} />}
                          {!isSorted && <ChevronsUpDown size={14} className="opacity-40" />}
                        </>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary bg-white">
            {sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "transition-colors",
                  striped && "even:bg-surface-secondary/50",
                  onRowClick && "cursor-pointer hover:bg-surface-secondary",
                )}
                onClick={() => onRowClick?.(item)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onRowClick(item)
                  }
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-sm text-content-primary",
                      compact && "px-3 py-2",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className,
                    )}
                  >
                    {col.render ? col.render(item) : String(item[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
