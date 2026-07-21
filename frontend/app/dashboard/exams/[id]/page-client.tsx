"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Edit3,
  Copy,
  Search,
  Trash2,
  BarChart3,
  ExternalLink,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, transformExam } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Dropdown } from "@/components/ui/dropdown"
import { formatDate, formatDuration } from "@/lib/utils"
import type { Exam } from "@/types"

interface AttemptWithStudent {
  id: string
  examId: string
  examTitle: string
  subject: string
  date: string
  score: number
  totalMarks: number
  passed: boolean
  duration: number
  studentName: string
  studentGrade: string
}

interface ExamStats {
  totalAttempts: number
  passed: number
  failed: number
  averageScore: number
}

const statusConfig: Record<string, { label: string; variant: "info" | "warning" | "success" | "danger" }> = {
  draft: { label: "Draft", variant: "info" },
  scheduled: { label: "Scheduled", variant: "info" },
  ongoing: { label: "Ongoing", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
}

export function ExamDetailClient({ examId }: { examId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "attempts">("overview")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<{ id: string; number: number; text: string }[]>([])
  const [attempts, setAttempts] = useState<AttemptWithStudent[]>([])
  const [stats, setStats] = useState<ExamStats>({ totalAttempts: 0, passed: 0, failed: 0, averageScore: 0 })

  useEffect(() => {
    async function load() {
      try {
        const [examApi, questionsData, results] = await Promise.all([
          api.exams.get(examId),
          api.questions.list(examId).catch(() => []),
          api.results.list({ exam: examId }).catch(() => ({ results: [] })),
        ])

        const transformedExam = transformExam(examApi)
        if (!transformedExam) {
          setError("Exam not found")
          return
        }
        setExam(transformedExam)
        const qList = Array.isArray(questionsData) ? questionsData : (questionsData as any)?.results ?? []
        setQuestions(qList.map((q: any) => ({ id: q.id, number: q.order, text: q.text })))

        const allAttempts = results.results.map((r: any) => ({
          id: r.attempt,
          examId: r.exam,
          examTitle: r.exam_title,
          subject: r.subject,
          date: r.graded_at,
          score: r.score,
          totalMarks: r.total_marks,
          passed: r.passed,
          duration: Math.round((r.duration_seconds || 0) / 60),
          studentName: r.student_name,
          studentGrade: "",
        }))

        setAttempts(allAttempts)
        setStats({
          totalAttempts: allAttempts.length,
          passed: allAttempts.filter((a: any) => a.passed).length,
          failed: allAttempts.filter((a: any) => !a.passed).length,
          averageScore: allAttempts.length > 0
            ? Math.round(allAttempts.reduce((sum: number, a: any) => {
                const pct = a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0
                return sum + pct
              }, 0) / allAttempts.length)
            : 0,
        })
      } catch {
        setError("Failed to load exam details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examId])

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-content-muted">Loading exam details...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (error || !exam) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-danger mb-2">{error || "Something went wrong"}</p>
            <Link href="/dashboard/exams" className="text-sm text-primary hover:underline">
              Back to Exams
            </Link>
          </div>
        </div>
      </Container>
    )
  }

  const config = statusConfig[exam.status] ?? { label: exam.status, variant: "primary" as const }

  return (
    <Container>
      <div className="mb-6">
        <Link
          href="/dashboard/exams"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
        >
          <ArrowLeft size={16} />
          Back to Exams
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-content-primary">{exam.title}</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="mt-1 text-content-secondary">
              {exam.course} &middot; {exam.courseCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/exam/${exam.id}`} target="_blank">
              <Button variant="outline" size="sm" leftIcon={<ExternalLink size={16} />}>
                Public View
              </Button>
            </Link>
            <Dropdown
              items={[
                { key: "edit", label: "Edit", icon: <Edit3 size={14} /> },
                { key: "duplicate", label: "Duplicate", icon: <Copy size={14} /> },
                { key: "analytics", label: "View Analytics", icon: <BarChart3 size={14} /> },
                { key: "divider1", label: "", divider: true },
                { key: "delete", label: "Delete", icon: <Trash2 size={14} />, danger: true },
              ]}
              onAction={(key) => {
                if (key === "edit") router.push(`/dashboard/exams/${exam.id}/edit`)
                if (key === "analytics") router.push(`/dashboard/exams/${exam.id}/analytics`)
                if (key === "duplicate") api.exams.duplicate(exam.id).then(() => router.refresh())
                if (key === "delete") { if (confirm("Delete this exam?")) api.exams.delete(exam.id).then(() => router.push("/dashboard/exams")) }
              }}
              variant="ghost"
              size="sm"
              label="Actions"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-content-muted">Date</p>
            <p className="text-sm font-medium text-content-primary">{formatDate(exam.date)}</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-content-muted">Duration</p>
            <p className="text-sm font-medium text-content-primary">{formatDuration(exam.duration)}</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-content-muted">Questions</p>
            <p className="text-sm font-medium text-content-primary">{exam.questionCount}</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-content-muted">Students</p>
            <p className="text-sm font-medium text-content-primary">{exam.enrolledStudents}</p>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-content-primary">{stats.totalAttempts}</p>
          <p className="text-xs text-content-muted">Total Attempts</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-success">{stats.passed}</p>
          <p className="text-xs text-content-muted">Passed</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-danger">{stats.failed}</p>
          <p className="text-xs text-content-muted">Failed</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.averageScore}%</p>
          <p className="text-xs text-content-muted">Avg Score</p>
        </Card>
      </div>

      <Card padding="lg">
        <div className="mb-4 flex items-center gap-1 border-b border-border-primary">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-content-muted hover:text-content-primary",
            )}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attempts")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "attempts"
                ? "border-primary text-primary"
                : "border-transparent text-content-muted hover:text-content-primary",
            )}
          >
            Attempts ({attempts.length})
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-content-primary">Exam Details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-secondary p-3">
                  <p className="text-xs text-content-muted">Total Marks</p>
                  <p className="text-sm font-medium text-content-primary">{exam.totalMarks}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary p-3">
                  <p className="text-xs text-content-muted">Passing Marks</p>
                  <p className="text-sm font-medium text-content-primary">{exam.passingMarks}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary p-3">
                  <p className="text-xs text-content-muted">Course</p>
                  <p className="text-sm font-medium text-content-primary">{exam.course}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary p-3">
                  <p className="text-xs text-content-muted">Course Code</p>
                  <p className="text-sm font-medium text-content-primary">{exam.courseCode}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-content-primary">Questions ({questions.length})</h3>
              {questions.length === 0 ? (
                <p className="text-sm text-content-muted">No questions added yet.</p>
              ) : (
                <div className="space-y-2">
                  {questions.slice(0, 5).map((q) => (
                    <div key={q.id} className="rounded-lg border border-border-primary p-3">
                      <p className="text-sm text-content-primary">
                        <span className="font-medium text-content-muted">Q{q.number}.</span> {q.text}
                      </p>
                    </div>
                  ))}
                  {questions.length > 5 && (
                    <p className="text-xs text-content-muted">...and {questions.length - 5} more questions</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "attempts" && (
          <div>
            {attempts.length === 0 ? (
              <div className="py-12 text-center">
                <GraduationCap size={40} className="mx-auto text-content-muted/40" />
                <p className="mt-3 text-sm text-content-muted">No attempts yet for this exam.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attempts.map((attempt) => {
                  const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0
                  return (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between rounded-lg border border-border-primary p-3 transition-colors hover:bg-surface-secondary/50"
                    >
                      <Link
                        href={`/dashboard/exams/${examId}/attempts/${attempt.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1 group"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {attempt.studentName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary transition-colors">{attempt.studentName}</p>
                          <p className="text-xs text-content-muted">{attempt.studentGrade}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-content-muted hidden sm:inline">{formatDate(attempt.date)}</span>
                        <div className="text-right">
                          <p className={cn("text-sm font-semibold", pct >= 60 ? "text-success" : "text-danger")}>
                            {attempt.totalMarks > 0 ? `${attempt.score}/${attempt.totalMarks}` : "-/-"}
                          </p>
                          <p className={cn("text-xs", pct >= 60 ? "text-success" : "text-danger")}>
                            {attempt.totalMarks > 0 ? `(${pct}%)` : "(-%)"}
                          </p>
                        </div>
                        {attempt.passed ? (
                          <CheckCircle2 size={18} className="text-success shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-danger shrink-0" />
                        )}
                        <Dropdown
                          trigger={<MoreHorizontal size={16} />}
                          items={[
                            { key: "review", label: "Review Performance", icon: <Search size={14} /> },
                          ]}
                          onAction={(key) => {
                            if (key === "review") router.push(`/dashboard/exams/${examId}/attempts/${attempt.id}`)
                          }}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </Container>
  )
}
