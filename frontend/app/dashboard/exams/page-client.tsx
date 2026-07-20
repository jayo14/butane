"use client"

import { useState, useMemo, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { Dropdown } from "@/components/ui/dropdown"
import { formatDate, formatDuration } from "@/lib/utils"
import { api, transformExam, fetchExams } from "@/lib/api"
import type { Exam } from "@/types"

const statusConfig: Record<string, { label: string; variant: "info" | "warning" | "success" | "danger" }> = {
  draft: { label: "Draft", variant: "info" },
  scheduled: { label: "Scheduled", variant: "info" },
  ongoing: { label: "Ongoing", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
}

const ITEMS_PER_PAGE = 6

export function ExamsPageClient() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchExams()
      .then(setExams)
      .catch(() => setExams([]))
      .finally(() => setLoading(false))
  }, [])

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
    { label: "Draft", value: "draft" },
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

      {/* Loading state */}
      {loading && (
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin" style={{ color: "#006c49" }} />
          </div>
        </Card>
      )}

      {/* Empty State (no exams at all) */}
      {!loading && exams.length === 0 && !hasActiveFilters && (
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
          <div className="space-y-4">
            {paginated.map((exam, i) => {
              const config = statusConfig[exam.status] ?? { label: exam.status, variant: "primary" as const }
              const statusColors: Record<string, { border: string; bg: string; text: string; dot: string }> = {
                draft: { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
                scheduled: { border: "border-l-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
                ongoing: { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
                completed: { border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
                cancelled: { border: "border-l-rose-500", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
              }
              const sc = statusColors[exam.status] || statusColors.draft
              return (
                <div
                  key={exam.id}
                  className={cn(
                    "group relative rounded-xl border border-border-primary bg-white transition-all duration-200",
                    "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
                    sc.border,
                    "border-l-4",
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                          sc.bg, sc.text
                        )}>
                          {exam.title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="truncate text-base font-semibold text-content-primary">
                              {exam.title}
                            </h3>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", sc.bg, sc.text)}>
                              <span className={cn("size-1.5 rounded-full", sc.dot)} />
                              {config.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-content-secondary">
                            {exam.course} <span className="text-content-muted">·</span> {exam.courseCode}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-content-muted">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-content-muted/70" />
                              {formatDate(exam.date)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-content-muted/70" />
                              {formatDuration(exam.duration)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FileText size={14} className="text-content-muted/70" />
                              {exam.questionCount} {exam.questionCount === 1 ? "question" : "questions"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users size={14} className="text-content-muted/70" />
                              {exam.enrolledStudents} {exam.enrolledStudents === 1 ? "student" : "students"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:shrink-0 sm:pl-4 sm:border-l sm:border-border-primary/60">
                        <Link href={`/dashboard/exams/${exam.id}`}>
                          <Button variant="ghost" size="sm" isIconOnly aria-label="View exam" className="text-content-muted hover:text-content-primary">
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
                            <button
                              type="button"
                              className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
                              aria-label="Exam actions"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          }
                        />
                      </div>
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
