"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/container"
import { LatexRenderer } from "@/components/ui/latex-renderer"
import { api } from "@/lib/api"
import type { ExamAttempt } from "@/types"

interface ReportsStats {
  totalStudents: number
  totalExams: number
  avgScore: number
  highest: number
  lowest: number
  passRate: number
  totalPassed: number
  totalAttempts: number
}

interface DistributionBucket {
  range: string
  count: number
  color: string
}

interface GradeAverage {
  grade: string
  avg: number
  count: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score >= 40) return "text-warning"
  return "text-danger"
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-success"
  if (score >= 60) return "bg-primary"
  if (score >= 40) return "bg-warning"
  return "bg-danger"
}

export function ReportsClient() {
  const [chartView, setChartView] = useState<"distribution" | "grades">("distribution")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReportsStats>({
    totalStudents: 0, totalExams: 0, avgScore: 0, highest: 0, lowest: 0, passRate: 0, totalPassed: 0, totalAttempts: 0,
  })
  const [distribution, setDistribution] = useState<DistributionBucket[]>([])
  const [gradeAverages, setGradeAverages] = useState<GradeAverage[]>([])
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [selectedExamId, setSelectedExamId] = useState("")
  const [examOptions, setExamOptions] = useState<{ id: string; title: string }[]>([])
  const [questionStats, setQuestionStats] = useState<any[]>([])
  const [questionStatsLoading, setQuestionStatsLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [resultsRes, studentsRes, examsRes] = await Promise.all([
          api.results.list(),
          api.students.list().catch(() => ({ results: [] })),
          api.exams.list({ page_size: 100 }).catch(() => ({ results: [] })),
        ])
        setExamOptions(((examsRes as any)?.results || []).map((e: any) => ({ id: e.id, title: e.title })))
        const allAttempts = (resultsRes?.results || []).map((r: any) => ({
          id: r.id,
          examId: r.exam,
          examTitle: r.exam_title,
          subject: r.subject,
          studentGrade: r.student_grade || "",
          date: r.graded_at,
          score: r.score,
          totalMarks: r.total_marks,
          passed: r.passed,
          duration: r.duration_seconds || 0,
          studentName: r.student_name,
        }))
        setAttempts(allAttempts)

        const scores = allAttempts.map((a: any) => (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0))
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
        const highest = scores.length > 0 ? Math.round(Math.max(...scores)) : 0
        const lowest = scores.length > 0 ? Math.round(Math.min(...scores)) : 0
        const passed = allAttempts.filter((a: any) => a.passed).length
        const passRate = allAttempts.length > 0 ? Math.round((passed / allAttempts.length) * 100) : 0
        const totalStudents = (studentsRes as any)?.results?.length || 0

        setStats({
          totalStudents,
          totalExams: allAttempts.length,
          avgScore, highest, lowest, passRate,
          totalPassed: passed,
          totalAttempts: allAttempts.length,
        })
        setDistribution([
          { range: "0-29%", count: scores.filter((s: number) => s < 30).length, color: "bg-danger" },
          { range: "30-49%", count: scores.filter((s: number) => s >= 30 && s < 50).length, color: "bg-warning" },
          { range: "50-69%", count: scores.filter((s: number) => s >= 50 && s < 70).length, color: "bg-primary" },
          { range: "70-89%", count: scores.filter((s: number) => s >= 70 && s < 90).length, color: "bg-info" },
          { range: "90-100%", count: scores.filter((s: number) => s >= 90).length, color: "bg-success" },
        ])
        const grouped: Record<string, { total: number; count: number }> = {}
        allAttempts.forEach((a: any) => {
          const g = a.studentGrade || "Unknown"
          if (!grouped[g]) grouped[g] = { total: 0, count: 0 }
          grouped[g].total += a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0
          grouped[g].count++
        })
        setGradeAverages(
          Object.entries(grouped)
            .map(([grade, data]) => ({ grade, avg: Math.round(data.total / data.count), count: data.count }))
            .sort((a, b) => a.grade.localeCompare(b.grade))
        )
      } catch {
        // Leave defaults (all zeros)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedExamId) { setQuestionStats([]); return }
    setQuestionStatsLoading(true)
    api.reports.questionStats(selectedExamId)
      .then((data: any) => setQuestionStats((data?.questions || []).sort((a: any, b: any) => a.correct_rate - b.correct_rate)))
      .catch(() => setQuestionStats([]))
      .finally(() => setQuestionStatsLoading(false))
  }, [selectedExamId])

  const maxDistCount = Math.max(...distribution.map((d) => d.count), 1)
  const maxGradeCount = Math.max(...gradeAverages.map((g) => g.count), 1)

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: "#006c49" }} />
        </div>
      </Container>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Reports & Analytics</h1>
        <p className="mt-0.5 text-sm text-content-secondary">
          Performance overview across {stats.totalStudents} students and {stats.totalAttempts} exam attempts
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {[
          { label: "Average Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: getScoreColor(stats.avgScore), bg: getScoreBg(stats.avgScore) },
          { label: "Highest Score", value: `${stats.highest}%`, icon: ArrowUp, color: "text-success", bg: "bg-success" },
          { label: "Lowest Score", value: `${stats.lowest}%`, icon: ArrowDown, color: "text-danger", bg: "bg-danger" },
          { label: "Pass Rate", value: `${stats.passRate}%`, icon: Trophy, color: "text-success", bg: "bg-success" },
          { label: "Students", value: stats.totalStudents, icon: Users, color: "text-info", bg: "bg-info" },
          { label: "Exams", value: stats.totalExams, icon: FileText, color: "text-primary", bg: "bg-primary" },
        ].map((stat) => (
          <Card key={stat.label} padding="md" className="text-center">
            <div className={cn("mx-auto mb-2 flex size-9 items-center justify-center rounded-xl", stat.bg + "/15")}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-lg font-bold text-content-primary">{stat.value}</p>
            <p className="text-[10px] text-content-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts + Question Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Section */}
        <Card padding="lg" className="lg:col-span-2">
          <Card.Header
            title="Performance Distribution"
            description="Score breakdown across all attempts"
            action={
              <div className="flex overflow-hidden rounded-lg border border-border-primary">
                <button
                  type="button"
                  onClick={() => setChartView("distribution")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    chartView === "distribution" ? "bg-primary text-white" : "text-content-muted hover:bg-surface-secondary",
                  )}
                >
                  Scores
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("grades")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    chartView === "grades" ? "bg-primary text-white" : "text-content-muted hover:bg-surface-secondary",
                  )}
                >
                  Grades
                </button>
              </div>
            }
          />

          {chartView === "distribution" ? (
            <div className="space-y-3">
              {distribution.map((bucket) => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-content-muted">{bucket.range}</span>
                  <div className="flex-1 h-8 rounded-lg bg-surface-secondary overflow-hidden">
                    <div
                      className={cn("h-full rounded-lg transition-all duration-700 flex items-center px-2", bucket.color)}
                      style={{ width: `${(bucket.count / maxDistCount) * 100}%` }}
                    >
                      {bucket.count > 0 && (
                        <span className="text-[11px] font-medium text-white">{bucket.count}</span>
                      )}
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-medium text-content-muted">{bucket.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {gradeAverages.map((g) => (
                <div key={g.grade} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-content-muted">{g.grade}</span>
                  <div className="flex-1 h-8 rounded-lg bg-surface-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-lg transition-all duration-700 flex items-center px-2",
                        getScoreBg(g.avg),
                      )}
                      style={{ width: `${g.avg}%` }}
                    >
                      <span className="text-[11px] font-medium text-white">{g.avg}%</span>
                    </div>
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] text-content-muted">
                    {g.count} student{g.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Question Statistics */}
        <Card padding="lg" className="lg:col-span-1">
          <Card.Header
            title="Question Statistics"
            description="Lowest correct rate first"
          />
          <div className="mb-3">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <option value="">Select an exam...</option>
              {examOptions.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.title}</option>
              ))}
            </select>
          </div>
          {questionStatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: "#006c49" }} />
            </div>
          ) : !selectedExamId ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-content-muted">Select an exam to view question statistics.</p>
            </div>
          ) : questionStats.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-content-muted">No attempts yet for this exam.</p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
              {questionStats.map((qs: any) => (
                <div key={qs.question_id} className="rounded-lg border border-border-primary p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-content-primary">
                      Q{qs.number}. <LatexRenderer text={qs.text} />
                    </span>
                    <Badge
                      variant={
                        qs.correct_rate >= 70 ? "success" :
                        qs.correct_rate >= 50 ? "warning" : "danger"
                      }
                      size="sm"
                    >
                      {qs.correct_rate}%
                    </Badge>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        qs.correct_rate >= 70 ? "bg-success" : qs.correct_rate >= 50 ? "bg-warning" : "bg-danger",
                      )}
                      style={{ width: `${qs.correct_rate}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-content-muted">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-success" />
                      {qs.correct_responses}
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle size={10} className="text-danger" />
                      {qs.responses - qs.correct_responses}
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle size={10} />
                      {qs.responses} total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Summary Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-success-light text-success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-lg font-bold text-content-primary">{stats.totalPassed}</p>
            <p className="text-xs text-content-muted">Passed</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-lg font-bold text-content-primary">{stats.totalAttempts - stats.totalPassed}</p>
            <p className="text-xs text-content-muted">Failed</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-lg font-bold text-content-primary">{stats.totalAttempts}</p>
            <p className="text-xs text-content-muted">Total Attempts</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-info-light text-info">
            <Target size={24} />
          </div>
          <div>
            <p className="text-lg font-bold text-content-primary">{stats.highest}%</p>
            <p className="text-xs text-content-muted">Top Score</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
