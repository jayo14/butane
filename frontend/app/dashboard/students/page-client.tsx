"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  SlidersHorizontal,
  X,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { StudentWithResults } from "@/types"

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  inactive: "warning",
  suspended: "danger",
}

interface StudentsPageClientProps {
  students: StudentWithResults[]
}

const ITEMS_PER_PAGE = 8

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score >= 40) return "text-warning"
  return "text-danger"
}

function getPerformanceBadge(avg: number) {
  if (avg >= 80) return { label: "Excellent", variant: "success" as const }
  if (avg >= 60) return { label: "Good", variant: "primary" as const }
  if (avg >= 40) return { label: "Average", variant: "warning" as const }
  return { label: "Needs Work", variant: "danger" as const }
}

export function StudentsPageClient({ students }: StudentsPageClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const grades = useMemo(() => {
    const set = new Set(students.map((s) => s.grade))
    return Array.from(set).sort()
  }, [students])

  const filtersActive = gradeFilter !== "all" || statusFilter !== "all"

  const filtered = useMemo(() => {
    let result = students
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
    }
    if (gradeFilter !== "all") result = result.filter((s) => s.grade === gradeFilter)
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter)
    return result
  }, [students, search, gradeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function clearFilters() {
    setGradeFilter("all")
    setStatusFilter("all")
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary md:text-2xl">Students</h1>
          <p className="mt-0.5 text-sm text-content-secondary">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
            {filtersActive && " matched"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border-primary bg-white">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid" ? "bg-primary text-white" : "text-content-muted hover:bg-surface-secondary",
              )}
              aria-label="Grid view"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list" ? "bg-primary text-white" : "text-content-muted hover:bg-surface-secondary",
              )}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by name, email, or ID..."
              className="h-10 w-full rounded-xl border border-border-primary bg-white pl-10 pr-4 text-sm text-content-primary placeholder:text-content-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<SlidersHorizontal size={16} />}
            className={cn(showFilters && "border-primary text-primary")}
          >
            Filters
            {filtersActive && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                {(gradeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </Button>
          {filtersActive && (
            <Button variant="ghost" onClick={clearFilters} leftIcon={<X size={16} />}>
              Clear
            </Button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-border-primary bg-white p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-muted">Grade</label>
                <select
                  value={gradeFilter}
                  onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1) }}
                  className="h-9 rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-lg"
                >
                  <option value="all">All Grades</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-muted">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                  className="h-9 rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-lg"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {paginated.length === 0 ? (
        <Card padding="lg" className="py-16 text-center">
          <GraduationCap size={48} className="mx-auto text-content-muted/40" />
          <h3 className="mt-4 text-lg font-semibold text-content-primary">No students found</h3>
          <p className="mt-1 text-sm text-content-secondary">
            {search || filtersActive ? "Try adjusting your search or filters." : "No students are enrolled yet."}
          </p>
          {(search || filtersActive) && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((student) => {
            const perf = getPerformanceBadge(student.summary.averageScore)
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => router.push(`/dashboard/students/${student.id}`)}
                className="group rounded-2xl border border-border-primary bg-white p-5 text-left shadow-card transition-all duration-200 hover:shadow-dropdown hover:-translate-y-0.5 hover:border-primary/20 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <Badge variant={statusVariant[student.status]} size="sm">
                    {student.status}
                  </Badge>
                </div>
                <h3 className="mt-3 font-semibold text-content-primary group-hover:text-primary transition-colors">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-content-muted">
                  <Mail size={12} />
                  {student.email}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-content-muted">
                  <GraduationCap size={12} />
                  <span>{student.grade}</span>
                  <span className="mx-1.5 text-border-primary">·</span>
                  <BookOpen size={12} />
                  <span>{student.summary.completedExams} exams</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border-primary pt-3">
                  <div>
                    <p className="text-[10px] text-content-muted">Avg Score</p>
                    <p className={cn("text-lg font-bold", getScoreColor(student.summary.averageScore))}>
                      {student.summary.averageScore}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-content-muted">Rank</p>
                    <p className="text-lg font-bold text-content-primary">#{student.summary.rank}</p>
                  </div>
                  <Badge variant={perf.variant} size="sm">{perf.label}</Badge>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-border-primary bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary bg-surface-secondary text-left text-xs font-medium text-content-muted">
                <th className="px-4 py-3 md:px-6">Student</th>
                <th className="px-4 py-3 md:px-6 hidden sm:table-cell">Grade</th>
                <th className="px-4 py-3 md:px-6 hidden md:table-cell">Exams</th>
                <th className="px-4 py-3 md:px-6">Avg Score</th>
                <th className="px-4 py-3 md:px-6 hidden sm:table-cell">Pass Rate</th>
                <th className="px-4 py-3 md:px-6 hidden lg:table-cell">Rank</th>
                <th className="px-4 py-3 md:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((student) => {
                const perf = getPerformanceBadge(student.summary.averageScore)
                return (
              <tr
                  key={student.id}
                  onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/students/${student.id}`) }}
                  className="cursor-pointer border-b border-border-primary last:border-0 transition-colors hover:bg-surface-secondary/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                    <td className="px-4 py-3.5 md:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-content-muted truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 hidden sm:table-cell">
                      <span className="text-sm text-content-muted">{student.grade}</span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 hidden md:table-cell">
                      <span className="text-sm text-content-primary">{student.summary.completedExams}</span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6">
                      <span className={cn("text-sm font-semibold", getScoreColor(student.summary.averageScore))}>
                        {student.summary.averageScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 hidden sm:table-cell">
                      <span className="text-sm text-content-primary">{student.summary.passRate}%</span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 hidden lg:table-cell">
                      <span className="text-sm text-content-muted">#{student.summary.rank}</span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6">
                      <Badge variant={statusVariant[student.status]} size="sm">
                        {student.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-content-muted">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              leftIcon={<ChevronLeft size={16} />}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  p === safePage
                    ? "bg-primary text-primary-foreground"
                    : "text-content-muted hover:bg-surface-secondary",
                )}
              >
                {p}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
