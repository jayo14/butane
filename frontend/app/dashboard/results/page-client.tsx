"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Filter,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { Dropdown } from "@/components/ui/dropdown"
import { formatDate, formatDuration } from "@/lib/utils"
import { api } from "@/lib/api"
import type { ExamAttempt, StudentWithResults } from "@/types"

const ITEMS_PER_PAGE = 10

export function ResultsPageClient() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [students, setStudents] = useState<StudentWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [examFilter, setExamFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    Promise.all([
      api.results.list().then(r => r.results || []).catch(() => []),
      api.students.list().catch(() => []),
    ]).then(([results, studentsList]) => {
      const students = Array.isArray(studentsList) ? studentsList : (studentsList as any).results || []
      setAttempts(results.map((r) => ({
        id: r.id,
        attemptId: r.attempt,
        examId: r.exam,
        examTitle: r.exam_title,
        subject: r.subject,
        studentGrade: r.student_grade || "",
        date: r.graded_at,
        score: r.score,
        totalMarks: r.total_marks,
        passed: r.passed,
        duration: Math.round((r.duration_seconds || 0) / 60),
        studentName: r.student_name || "",
      })))
      setStudents(students.map((s: any) => ({
        id: s.id,
        firstName: s.user?.first_name || "",
        lastName: s.user?.last_name || "",
        email: s.user?.email || "",
        grade: s.grade,
        status: s.status,
        summary: { totalExams: 0, completedExams: 0, averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0, rank: 0 },
        attempts: [] as any[],
      })))
    }).finally(() => setLoading(false))
  }, [])

  const examNames = useMemo(() => {
    const set = new Set(attempts.map((a) => a.examTitle))
    return Array.from(set).sort()
  }, [attempts])

  const subjectNames = useMemo(() => {
    const set = new Set(attempts.map((a) => a.subject).filter(Boolean))
    return Array.from(set).sort()
  }, [attempts])

  const filtered = useMemo(() => {
    let result = attempts

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.examTitle.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q),
      )
    }

    if (examFilter !== "all") {
      result = result.filter((a) => a.examTitle === examFilter)
    }

    if (subjectFilter !== "all") {
      result = result.filter((a) => a.subject === subjectFilter)
    }

    if (statusFilter === "passed") result = result.filter((a) => a.passed)
    else if (statusFilter === "failed") result = result.filter((a) => !a.passed)

    return result
  }, [attempts, search, examFilter, subjectFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const filtersActive = examFilter !== "all" || subjectFilter !== "all" || statusFilter !== "all"

  function clearFilters() {
    setExamFilter("all")
    setSubjectFilter("all")
    setStatusFilter("all")
  }

  function getStudentName(attempt: ExamAttempt): string {
    if (attempt.studentName) return attempt.studentName
    const s = students.find((s) => s.attempts.some((a) => a.id === attempt.id))
    if (s) return `${s.firstName} ${s.lastName}`.trim() || "Unknown"
    return "Unknown"
  }

  function getScoreColor(pct: number): string {
    if (pct >= 80) return "text-success"
    if (pct >= 60) return "text-primary"
    if (pct >= 40) return "text-warning"
    return "text-danger"
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-primary">Results</h1>
        <p className="mt-1 text-content-secondary">
          View all exam attempts and scores across students
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by exam title, course, or ID..."
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
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter size={16} />}
            className={cn(showFilters && "border-primary text-primary")}
          >
            Filters
            {filtersActive && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                {(examFilter !== "all" ? 1 : 0) + (subjectFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </Button>
          {filtersActive && (
            <Button variant="ghost" onClick={clearFilters} leftIcon={<X size={16} />}>
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-border-primary bg-white p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-muted">Exam</label>
                <select
                  value={examFilter}
                  onChange={(e) => { setExamFilter(e.target.value); setCurrentPage(1) }}
                  className="h-9 rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="all">All Exams</option>
                  {examNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-muted">Subject</label>
                <select
                  value={subjectFilter}
                  onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); setSelectedIds(new Set()) }}
                  className="h-9 rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="all">All Subjects</option>
                  {subjectNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-muted">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                  className="h-9 rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="all">All Results</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin" style={{ color: "#006c49" }} />
          </div>
        </Card>
      )}

      {!loading && attempts.length === 0 && (
        <Card padding="lg">
          <EmptyState
            icon={<GraduationCap size={40} />}
            title="No results yet"
            description="Results will appear once students start taking exams."
          />
        </Card>
      )}

      {filtered.length === 0 && attempts.length > 0 && (
        <Card padding="lg">
          <EmptyState
            icon={<FileText size={40} />}
            title="No results match your search"
            description="Try adjusting your filters or search terms."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      )}

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3">
          <span className="text-sm text-content-primary">
            {selectedIds.size} result{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-105 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete Selected
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-content-muted hover:text-content-primary"
          >
            Clear selection
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <div className="rounded-xl border border-border-primary bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary bg-surface-secondary text-left text-xs font-medium text-content-muted">
                  <th className="px-4 py-3 md:px-6 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && paginated.every((a) => selectedIds.has(a.id))}
                      onChange={() => {
                        if (paginated.every((a) => selectedIds.has(a.id))) {
                          setSelectedIds(new Set([...selectedIds].filter((id) => !paginated.some((a) => a.id === id))))
                        } else {
                          const next = new Set(selectedIds)
                          paginated.forEach((a) => next.add(a.id))
                          setSelectedIds(next)
                        }
                      }}
                      className="size-4 rounded border-border-primary accent-[#006c49]"
                    />
                  </th>
                  <th className="px-4 py-3 md:px-6">Student</th>
                  <th className="px-4 py-3 md:px-6">Exam</th>
                  <th className="px-4 py-3 md:px-6 hidden sm:table-cell">Subject</th>
                  <th className="px-4 py-3 md:px-6 hidden md:table-cell">Grade</th>
                  <th className="px-4 py-3 md:px-6 hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 md:px-6">Score</th>
                  <th className="px-4 py-3 md:px-6 hidden sm:table-cell">Duration</th>
                  <th className="px-4 py-3 md:px-6 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((attempt) => {
                  const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0
                  return (
                    <tr
                      key={attempt.id}
                      className={cn(
                        "border-b border-border-primary last:border-0 transition-colors",
                        selectedIds.has(attempt.id) ? "bg-primary/5" : "hover:bg-surface-secondary/50",
                      )}
                    >
                      <td className="px-4 py-3.5 md:px-6 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(attempt.id)}
                          onChange={() => {
                            const next = new Set(selectedIds)
                            if (next.has(attempt.id)) next.delete(attempt.id)
                            else next.add(attempt.id)
                            setSelectedIds(next)
                          }}
                          className="size-4 rounded border-border-primary accent-[#006c49]"
                        />
                      </td>
                      <td className="px-4 py-3.5 md:px-6">
                        <span className="text-sm font-medium text-content-primary">
                          {getStudentName(attempt)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6">
                        <span className="text-sm text-content-primary">{attempt.examTitle}</span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 hidden sm:table-cell">
                        <span className="text-sm text-content-muted">{attempt.subject}</span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 hidden md:table-cell">
                        <span className="text-sm text-content-muted">{attempt.studentGrade || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 hidden md:table-cell">
                        <span className="text-sm text-content-muted">{formatDate(attempt.date)}</span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold", getScoreColor(pct))}>
                            {attempt.score}/{attempt.totalMarks}
                          </span>
                          <span className={cn("text-xs", getScoreColor(pct))}>({pct}%)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 hidden sm:table-cell">
                        <span className="text-sm text-content-muted">{formatDuration(attempt.duration)}</span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 w-10">
                        <Dropdown
                          trigger={<MoreHorizontal size={16} />}
                          items={[
                            { key: "review", label: "Review Performance", icon: <Search size={14} /> },
                          ]}
                          onAction={() => {
                            if (attempt.attemptId) {
                              router.push(`/dashboard/exams/${attempt.examId}/attempts/${attempt.attemptId}`)
                            }
                          }}
                          variant="ghost"
                          size="sm"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-content-muted">
                Page {safePage} of {totalPages}
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
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border-primary bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-content-primary">Delete Results?</h3>
            <p className="mb-6 text-sm text-content-secondary">
              This will permanently delete {selectedIds.size} result{selectedIds.size > 1 ? "s" : ""}.
              Students will lose access to their scores and reviews. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-border-primary py-3 text-sm font-semibold text-content-primary transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await api.results.bulkDelete([...selectedIds])
                    setAttempts((prev) => prev.filter((a) => !selectedIds.has(a.id)))
                    setSelectedIds(new Set())
                    setShowDeleteConfirm(false)
                  } catch {
                    alert("Failed to delete results. Please try again.")
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-3 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
