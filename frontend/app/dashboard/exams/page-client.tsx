"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  MoreHorizontal,
  Copy,
  Edit3,
  Eye,
  BarChart3,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  Users,
  FileText,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { Dropdown } from "@/components/ui/dropdown"
import { formatDate, formatDuration } from "@/lib/utils"
import { api, transformExam } from "@/lib/api"
import type { Exam } from "@/types"

const statusConfig: Record<string, { label: string; variant: "info" | "warning" | "success" | "danger" }> = {
  scheduled: { label: "Scheduled", variant: "info" },
  ongoing: { label: "Ongoing", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
}

const ITEMS_PER_PAGE = 6

export function ExamsPageClient({ exams: initialExams }: { exams: Exam[] }) {
  const router = useRouter()
  const [exams, setExams] = useState(initialExams)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    let result = exams

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.course.toLowerCase().includes(q) ||
          e.courseCode.toLowerCase().includes(q),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter)
    }

    return result
  }, [exams, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Ongoing", value: "ongoing" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ]

  async function handleDelete(id: string) {
    try {
      await api.exams.delete(id)
      setExams((prev) => prev.filter((e) => e.id !== id))
    } catch {}
  }

  async function handleDuplicate(id: string) {
    try {
      const created = await api.exams.duplicate(id)
      setExams((prev) => [...prev, transformExam(created)])
    } catch {}
  }

  async function handleToggleStatus(id: string) {
    try {
      const updated = await api.exams.publish(id)
      setExams((prev) =>
        prev.map((e) => (e.id === id ? transformExam(updated) : e)),
      )
    } catch {}
  }

  function clearFilters() {
    setSearch("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const hasActiveFilters = search || statusFilter !== "all"
  const isEmpty = filtered.length === 0 && hasActiveFilters

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">My Exams</h1>
          <p className="mt-1 text-content-secondary">
            Manage all your computer-based tests
          </p>
        </div>
        <Link href="/dashboard/exams/create">
          <Button leftIcon={<Plus size={18} />}>Create Exam</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by title, course, or code..."
              className="h-10 w-full rounded-xl border border-border-primary bg-white pl-10 pr-4 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="h-10 w-full appearance-none rounded-xl border border-border-primary bg-white pl-4 pr-10 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Empty State (no exams at all) */}
      {exams.length === 0 && !hasActiveFilters && (
        <Card padding="lg">
          <EmptyState
            icon={<GraduationCap size={40} />}
            title="No exams yet"
            description="Create your first computer-based test to get started."
            action={
              <Link href="/dashboard/exams/create">
                <Button leftIcon={<Plus size={18} />}>Create Your First Exam</Button>
              </Link>
            }
          />
        </Card>
      )}

      {/* Empty State (no results for filters) */}
      {isEmpty && (
        <Card padding="lg">
          <EmptyState
            icon={<FileText size={40} />}
            title="No exams match your search"
            description="Try adjusting your filters or search terms."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      )}

      {/* Exam Cards */}
      {!isEmpty && exams.length > 0 && (
        <>
          <div className="space-y-3">
            {paginated.map((exam, i) => {
              const config = statusConfig[exam.status] ?? { label: exam.status, variant: "primary" as const }
              return (
                <div
                  key={exam.id}
                  className={cn(
                    "group rounded-xl border border-border-primary bg-white p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card",
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-content-primary">
                            {exam.title}
                          </h3>
                          <Badge variant={config.variant} size="sm">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-content-secondary">
                          {exam.course} &middot; {exam.courseCode}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(exam.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(exam.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {exam.questionCount} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {exam.enrolledStudents} students
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Link href={`/dashboard/exams/${exam.id}`}>
                        <Button variant="ghost" size="sm" isIconOnly aria-label="View exam">
                          <Eye size={16} />
                        </Button>
                      </Link>
                      <Dropdown
                        items={[
                          { key: "edit", label: "Edit", icon: <Edit3 size={14} /> },
                          { key: "duplicate", label: "Duplicate", icon: <Copy size={14} /> },
                          { key: "analytics", label: "View Analytics", icon: <BarChart3 size={14} /> },
                          { key: "divider1", label: "", divider: true },
                          { key: "toggle-status", label: exam.status === "completed" ? "Republish" : "Publish", icon: <Send size={14} /> },
                          { key: "divider2", label: "", divider: true },
                          { key: "delete", label: "Delete", icon: <Trash2 size={14} />, danger: true },
                        ]}
                        onAction={(key) => {
                          if (key === "delete") handleDelete(exam.id)
                          if (key === "duplicate") handleDuplicate(exam.id)
                          if (key === "toggle-status") handleToggleStatus(exam.id)
                          if (key === "edit") router.push(`/dashboard/exams/${exam.id}/edit`)
                          if (key === "analytics") router.push(`/dashboard/exams/${exam.id}/analytics`)
                        }}
                        variant="ghost"
                        size="sm"
                        label=""
                        trigger={
                          <span
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { const btn = e.currentTarget.closest('[data-trigger]'); if (btn) (btn as HTMLElement).click() } }}
                            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
                            aria-label="Exam actions"
                          >
                            <MoreHorizontal size={18} />
                          </span>
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-content-muted">
                Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} exams
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex size-9 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl text-sm font-medium transition-all",
                      page === safePage
                        ? "bg-primary text-primary-foreground"
                        : "text-content-muted hover:bg-surface-secondary hover:text-content-primary",
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex size-9 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  )
}
