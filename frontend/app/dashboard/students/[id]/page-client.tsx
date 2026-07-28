"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  GraduationCap,
  Calendar,
  BookOpen,
  Trophy,
  TrendingUp,
  Target,
  BarChart3,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table } from "@/components/ui/table"
import { formatDate, formatDuration } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { StudentWithResults, ReportCardHistoryItem } from "@/types"

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
  history: ReportCardHistoryItem[] | null
}

const ITEMS_PER_PAGE = 5

export function StudentProfileClient({ student, history }: StudentProfileClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [tab, setTab] = useState<"exams" | "history" | "annual">("history")

  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
  const [selectedSession, setSelectedSession] = useState("")
  const [annualData, setAnnualData] = useState<any>(null)
  const [annualLoading, setAnnualLoading] = useState(false)

  const filteredAttempts = useMemo(() => {
    if (!search.trim()) return student.attempts
    const q = search.toLowerCase()
    return student.attempts.filter(
      (a) =>
        a.examTitle.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q),
    )
  }, [student.attempts, search])

  const totalPages = Math.max(1, Math.ceil(filteredAttempts.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filteredAttempts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const groupedHistory = useMemo(() => {
    if (!history) return []
    const sessions: any[] = []
    const map = new Map<string, any>()
    for (const item of history) {
      const sessionName = item.session_name || "Unknown Session"
      if (!map.has(sessionName)) {
        const session = { name: sessionName, id: item.session, terms: [] as any[] }
        map.set(sessionName, session)
        sessions.push(session)
      }
      map.get(sessionName)!.terms.push(item)
    }
    return sessions
  }, [history])

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    async function load() {
      try {
        const res = await api.academics.sessions().catch(() => ({ results: [] })) as any
        setSessions((res.results || []).map((s: any) => ({ id: s.id, name: s.name })))
      } catch {
        setSessions([])
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedSession || tab !== "annual") {
      setAnnualData(null)
      return
    }
    let cancelled = false
    async function load() {
      setAnnualLoading(true)
      try {
        const data = await api.academics.annualSummary(student.id, selectedSession)
        if (!cancelled) setAnnualData(data)
      } catch {
        if (!cancelled) setAnnualData(null)
      } finally {
        if (!cancelled) setAnnualLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedSession, tab, student.id])

  function getPerformanceMessage(avg: number) {
    if (avg >= 80) return { title: "Excellent Performer", message: "Consistently excels across all subjects." }
    if (avg >= 60) return { title: "Strong Performer", message: "Shows solid understanding with room to grow." }
    if (avg >= 40) return { title: "Developing", message: "Making progress. Focus on weaker areas." }
    return { title: "Needs Improvement", message: "Additional support and practice recommended." }
  }

  const perf = getPerformanceMessage(student.summary.averageScore)

  const annualTerms = annualData?.terms || []
  const annualAverage = annualData?.annual_average ?? null
  const termsRecorded = annualData?.terms_recorded ?? 0

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/dashboard/students")}
        className="mb-4 flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

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
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button variant="outline" size="sm" leftIcon={<FileText size={16} />}>
                    Manage History
                  </Button>
                )}
                <Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
                  Export Report
                </Button>
              </div>
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

        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex rounded-xl border border-border-primary bg-surface-secondary p-1">
              <button
                type="button"
                onClick={() => setTab("exams")}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === "exams" ? "bg-white text-content-primary shadow-sm" : "text-content-muted hover:text-content-primary")}
              >
                Exam Attempts
              </button>
              <button
                type="button"
                onClick={() => setTab("history")}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === "history" ? "bg-white text-content-primary shadow-sm" : "text-content-muted hover:text-content-primary")}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setTab("annual")}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === "annual" ? "bg-white text-content-primary shadow-sm" : "text-content-muted hover:text-content-primary")}
              >
                Annual
              </button>
            </div>
            {tab === "exams" && (
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  placeholder="Search attempts..."
                  className="h-9 w-64 rounded-xl border border-border-primary bg-surface-secondary pl-9 pr-4 text-sm text-content-primary placeholder:text-content-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-xl"
                />
              </div>
            )}
          </div>

          {tab === "exams" && (
            paginated.length === 0 ? (
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
                              {attempt.subject}
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
            )
          )}

          {tab === "history" && (
            groupedHistory.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={32} className="mx-auto text-content-muted/40" />
                <p className="mt-2 text-sm text-content-muted">No report card history yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedHistory.map((session) => (
                  <div key={session.id} className="rounded-xl border border-border-primary">
                    <div className="border-b border-border-primary bg-surface-secondary/40 px-4 py-3">
                      <h4 className="text-sm font-semibold text-content-primary">{session.name}</h4>
                    </div>
                    <div className="divide-y divide-border-primary">
                      {session.terms.map((termItem: any) => (
                        <div key={termItem.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-content-primary">{termItem.term?.name || termItem.term_name || "Term"}</p>
                            <p className="text-xs text-content-muted">Classroom: {termItem.classroom?.name || termItem.classroom_name || "-"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-content-muted">Avg</p>
                              <p className="text-sm font-semibold text-content-primary">{termItem.average_score ?? termItem.average ?? "-"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-content-muted">Position</p>
                              <p className="text-sm font-semibold text-content-primary">{termItem.position ?? "-"}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/report-cards/${termItem.id}`)}>
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "annual" && (
            <div>
              <div className="mb-4">
                <Select
                  label="Session"
                  options={sessions.map((s) => ({ label: s.name, value: s.id }))}
                  value={selectedSession}
                  onChange={(value) => setSelectedSession(value || "")}
                  placeholder="Select session"
                />
              </div>

              {annualLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "#006c49" }} />
                </div>
              ) : selectedSession && annualData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((termNum) => {
                      const termData = annualTerms.find((t: any) => t.term?.display_order === termNum)
                      const avg = termData?.average_score ?? termData?.average ?? null
                      const grade = termData?.grade || null
                      const isRecorded = termData != null
                      return (
                        <Card key={termNum} padding="md" className="text-center">
                          <p className="text-xs font-semibold text-content-muted mb-1">Term {termNum}</p>
                          {isRecorded ? (
                            <>
                              <p className="text-2xl font-bold text-content-primary">{avg ?? "-"}</p>
                              <Badge variant={grade ? "success" : "warning"} size="sm">{grade || "Pending"}</Badge>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-content-muted">-</p>
                              <p className="text-xs text-content-muted">Not yet recorded</p>
                            </>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                  <Card padding="lg" className="bg-primary/5 border-primary/20">
                    <div className="text-center">
                      <p className="text-xs text-content-muted uppercase tracking-wider">Annual Average</p>
                      <p className="text-3xl font-bold text-content-primary mt-1">{annualAverage ?? "-"}</p>
                      <p className="text-xs text-content-muted mt-1">{termsRecorded} of 3 terms recorded</p>
                    </div>
                  </Card>
                </div>
              ) : selectedSession ? (
                <div className="py-12 text-center">
                  <BarChart3 size={32} className="mx-auto text-content-muted/40" />
                  <p className="mt-2 text-sm text-content-muted">No annual data available for this session.</p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <BarChart3 size={32} className="mx-auto text-content-muted/40" />
                  <p className="mt-2 text-sm text-content-muted">Select a session to view annual summary.</p>
                </div>
              )}
            </div>
          )}

          {tab === "exams" && totalPages > 1 && (
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
