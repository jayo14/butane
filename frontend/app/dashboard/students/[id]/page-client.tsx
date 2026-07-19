"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  BookOpen,
  Trophy,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDuration } from "@/lib/utils"
import type { StudentWithResults } from "@/data/mock/student-results"

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  inactive: "warning",
  suspended: "danger",
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score >= 40) return "text-warning"
  return "text-danger"
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-success-light text-success"
  if (score >= 60) return "bg-primary/10 text-primary"
  if (score >= 40) return "bg-warning-light text-warning"
  return "bg-danger-light text-danger"
}

interface StudentProfileClientProps {
  student: StudentWithResults
}

const ITEMS_PER_PAGE = 5

export function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAttempts = useMemo(() => {
    if (!search.trim()) return student.attempts
    const q = search.toLowerCase()
    return student.attempts.filter(
      (a) =>
        a.examTitle.toLowerCase().includes(q) || a.course.toLowerCase().includes(q),
    )
  }, [student.attempts, search])

  const totalPages = Math.max(1, Math.ceil(filteredAttempts.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filteredAttempts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function getPerformanceMessage(avg: number) {
    if (avg >= 80) return { title: "Excellent Performer", message: "Consistently excels across all subjects." }
    if (avg >= 60) return { title: "Strong Performer", message: "Shows solid understanding with room to grow." }
    if (avg >= 40) return { title: "Developing", message: "Making progress. Focus on weaker areas." }
    return { title: "Needs Improvement", message: "Additional support and practice recommended." }
  }

  const perf = getPerformanceMessage(student.summary.averageScore)

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/students")}
        className="mb-4 flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      {/* Profile Header Card */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-content-primary md:text-2xl">
                    {student.firstName} {student.lastName}
                  </h1>
                  <Badge variant={statusVariant[student.status]}>{student.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-content-secondary">{student.email}</p>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
                Export Report
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-content-muted sm:justify-start">
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} />
                {student.grade}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                {student.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                ID: {student.id}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Exams Taken", value: student.summary.completedExams, icon: BookOpen, color: "text-info", bg: "bg-info-light" },
          { label: "Average Score", value: `${student.summary.averageScore}%`, icon: TrendingUp, color: getScoreColor(student.summary.averageScore), bg: getScoreBg(student.summary.averageScore).split(" ")[0] },
          { label: "Pass Rate", value: `${student.summary.passRate}%`, icon: Trophy, color: "text-success", bg: "bg-success-light" },
          { label: "Overall Rank", value: `#${student.summary.rank}`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat) => (
          <Card key={stat.label} padding="md" className="text-center">
            <div className={cn("mx-auto mb-2 flex size-10 items-center justify-center rounded-xl", stat.bg)}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-xl font-bold text-content-primary">{stat.value}</p>
            <p className="text-xs text-content-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Overview */}
        <Card padding="lg" className="lg:col-span-1">
          <Card.Header title="Performance" description="Overall assessment" />
          <div className="space-y-4">
            <div className={cn(
              "rounded-xl border p-4",
              student.summary.averageScore >= 60 ? "border-success/30 bg-success-light/20" : "border-warning/30 bg-warning-light/20",
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  student.summary.averageScore >= 60 ? "bg-success text-white" : "bg-warning text-white",
                )}>
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-content-primary">{perf.title}</p>
                  <p className="text-xs text-content-muted">{perf.message}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-content-muted">Average Score</span>
                <span className={cn("font-semibold", getScoreColor(student.summary.averageScore))}>
                  {student.summary.averageScore}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    student.summary.averageScore >= 80 ? "bg-success" :
                    student.summary.averageScore >= 60 ? "bg-primary" :
                    student.summary.averageScore >= 40 ? "bg-warning" : "bg-danger",
                  )}
                  style={{ width: `${student.summary.averageScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-content-muted">Pass Rate</span>
                <span className="font-semibold text-content-primary">{student.summary.passRate}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${student.summary.passRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-primary bg-surface-secondary p-3">
              <div className="text-center">
                <p className="text-xs text-content-muted">Highest</p>
                <p className={cn("text-lg font-bold", getScoreColor(student.summary.highestScore))}>
                  {student.summary.highestScore}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-content-muted">Lowest</p>
                <p className={cn("text-lg font-bold", getScoreColor(student.summary.lowestScore))}>
                  {student.summary.lowestScore}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Attempts / Results */}
        <Card padding="lg" className="lg:col-span-2">
          <Card.Header
            title="Exam Attempts"
            description={`${filteredAttempts.length} attempt${filteredAttempts.length !== 1 ? "s" : ""}`}
          />

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search attempts..."
              className="h-9 w-full rounded-xl border border-border-primary bg-surface-secondary pl-9 pr-4 text-sm text-content-primary placeholder:text-content-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-xl"
            />
          </div>

          {paginated.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen size={32} className="mx-auto text-content-muted/40" />
              <p className="mt-2 text-sm text-content-muted">No attempts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map((attempt) => {
                const scorePct = Math.round((attempt.score / attempt.totalMarks) * 100)
                return (
                  <div
                    key={attempt.id}
                    tabIndex={0}
                    className="rounded-xl border border-border-primary p-4 transition-colors hover:bg-surface-secondary/30 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-content-primary truncate">
                            {attempt.examTitle}
                          </h4>
                          <Badge variant={attempt.passed ? "success" : "danger"} size="sm">
                            {attempt.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            {attempt.course}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(attempt.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(attempt.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:text-right">
                        <div>
                          <p className="text-xs text-content-muted">Score</p>
                          <p className={cn("text-lg font-bold", getScoreColor(scorePct))}>
                            {attempt.score}/{attempt.totalMarks}
                          </p>
                        </div>
                        <div className={cn(
                          "flex size-12 items-center justify-center rounded-xl text-sm font-bold",
                          getScoreBg(scorePct),
                        )}>
                          {scorePct}%
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border-primary pt-4">
              <p className="text-xs text-content-muted">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  leftIcon={<ChevronLeft size={14} />}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  rightIcon={<ChevronRight size={14} />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
