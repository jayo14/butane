"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Filter,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate, formatDuration } from "@/lib/utils"
import { api } from "@/lib/api"
import type { ExamAttempt, StudentWithResults } from "@/types"

const ITEMS_PER_PAGE = 10

export function ResultsPageClient() {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [students, setStudents] = useState<StudentWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [examFilter, setExamFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    Promise.all([
      api.results.list().then(r => r.results || []).catch(() => []),
      api.students.list().catch(() => []),
    ]).then(([results, studentsList]) => {
      const students = Array.isArray(studentsList) ? studentsList : (studentsList as any).results || []
      setAttempts(results.map((r) => ({
        id: r.id,
        examId: r.exam,
        examTitle: r.exam_title,
        subject: r.subject,
        date: r.graded_at,
        score: r.score,
        totalMarks: r.total_marks,
        passed: r.passed,
        duration: r.duration_seconds || 0,
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

  const filtered = useMemo(() => {
    let result = attempts

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.examTitle.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q),
      )
    }

    if (examFilter !== "all") {
      result = result.filter((a) => a.examTitle === examFilter)
    }

    if (statusFilter === "passed") result = result.filter((a) => a.passed)
    else if (statusFilter === "failed") result = result.filter((a) => !a.passed)

    return result
  }, [attempts, search, examFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const filtersActive = examFilter !== "all" || statusFilter !== "all"

  function clearFilters() {
    setExamFilter("all")
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
                {(examFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
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

      {filtered.length > 0 && (
        <>
          <div className="rounded-xl border border-border-primary bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary bg-surface-secondary text-left text-xs font-medium text-content-muted">
                  <th className="px-4 py-3 md:px-6">Student</th>
                  <th className="px-4 py-3 md:px-6">Exam</th>
                  <th className="px-4 py-3 md:px-6 hidden sm:table-cell">Subject</th>
                  <th className="px-4 py-3 md:px-6 hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 md:px-6">Score</th>
                  <th className="px-4 py-3 md:px-6 hidden sm:table-cell">Duration</th>
                  <th className="px-4 py-3 md:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((attempt) => {
                  const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0
                  return (
                    <tr
                      key={attempt.id}
                      className="border-b border-border-primary last:border-0 transition-colors hover:bg-surface-secondary/50"
                    >
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
                      <td className="px-4 py-3.5 md:px-6">
                        {attempt.totalMarks > 0 && attempt.passed ? (
                          <Badge variant="success" size="sm">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Passed
                            </span>
                          </Badge>
                        ) : attempt.totalMarks > 0 ? (
                          <Badge variant="danger" size="sm">
                            <span className="flex items-center gap-1">
                              <XCircle size={10} />
                              Failed
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            <span className="flex items-center gap-1">
                              N/A
                            </span>
                          </Badge>
                        )}
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
    </Container>
  )
}
