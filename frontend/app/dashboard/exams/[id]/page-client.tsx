"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Edit3,
  Copy,
  Send,
  Trash2,
  BarChart3,
  ExternalLink,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  course: string
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
  scheduled: { label: "Scheduled", variant: "info" },
  ongoing: { label: "Ongoing", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
}

interface ExamDetailClientProps {
  exam: Exam
  questions: { id: string; number: number; text: string }[]
  attempts: AttemptWithStudent[]
  stats: ExamStats
}

export function ExamDetailClient({ exam, questions, attempts, stats }: ExamDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "attempts">("overview")
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
                { key: "toggle-status", label: exam.status === "completed" ? "Republish" : "Publish", icon: <Send size={14} /> },
                { key: "divider2", label: "", divider: true },
                { key: "delete", label: "Delete", icon: <Trash2 size={14} />, danger: true },
              ]}
              onAction={(key) => {
                if (key === "edit") router.push(`/dashboard/exams/${exam.id}/edit`)
                if (key === "analytics") router.push(`/dashboard/exams/${exam.id}/analytics`)
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
                  const pct = Math.round((attempt.score / attempt.totalMarks) * 100)
                  return (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between rounded-lg border border-border-primary p-3 transition-colors hover:bg-surface-secondary/50"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {attempt.studentName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate">{attempt.studentName}</p>
                          <p className="text-xs text-content-muted">{attempt.studentGrade}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm text-content-muted hidden sm:inline">{formatDate(attempt.date)}</span>
                        <div className="text-right">
                          <p className={cn("text-sm font-semibold", pct >= 60 ? "text-success" : "text-danger")}>
                            {attempt.score}/{attempt.totalMarks}
                          </p>
                          <p className={cn("text-xs", pct >= 60 ? "text-success" : "text-danger")}>({pct}%)</p>
                        </div>
                        {attempt.passed ? (
                          <CheckCircle2 size={18} className="text-success shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-danger shrink-0" />
                        )}
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
