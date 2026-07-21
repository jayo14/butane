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
  const [gradeAverages] = useState<GradeAverage[]>([])
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [resultsRes, studentsRes] = await Promise.all([
          api.results.list(),
          api.students.list().catch(() => ({ results: [] })),
        ])
        const allAttempts = (resultsRes?.results || []).map((r: any) => ({
          id: r.id,
          examId: r.exam,
          examTitle: r.exam_title,
          subject: r.subject,
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
      } catch {
        // Leave defaults (all zeros)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-content-muted">Question statistics require selecting a specific exam.</p>
          </div>
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
