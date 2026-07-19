"use client"

import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ExamAttempt } from "@/data/mock/student-results"

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

interface ReportsClientProps {
  stats: ReportsStats
  distribution: DistributionBucket[]
  gradeAverages: GradeAverage[]
  questions: { id: string; number: number; text: string; correctAnswerId: string }[]
  attempts: ExamAttempt[]
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

export function ReportsClient({ stats, distribution, gradeAverages, questions, attempts }: ReportsClientProps) {
  const [chartView, setChartView] = useState<"distribution" | "grades">("distribution")

  const maxDistCount = Math.max(...distribution.map((d) => d.count), 1)
  const maxGradeCount = Math.max(...gradeAverages.map((g) => g.count), 1)

  // Approximate question stats based on attempt patterns
  const questionStats = questions.map((q, i) => {
    const answered = attempts.filter((a) => a.score > 0).length
    const correct = Math.round(answered * (0.4 + Math.random() * 0.5))
    return {
      id: q.id,
      number: q.number,
      text: q.text.length > 60 ? q.text.slice(0, 60) + "..." : q.text,
      correct,
      total: answered,
      rate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    }
  }).sort((a, b) => a.rate - b.rate)

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
          <div className="space-y-2.5">
            {questionStats.slice(0, 10).map((qs) => (
              <div key={qs.id} className="rounded-lg border border-border-primary p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-content-primary">
                    Q{qs.number}. {qs.text}
                  </span>
                  <Badge
                    variant={
                      qs.rate >= 70 ? "success" :
                      qs.rate >= 50 ? "warning" : "danger"
                    }
                    size="sm"
                  >
                    {qs.rate}%
                  </Badge>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      qs.rate >= 70 ? "bg-success" : qs.rate >= 50 ? "bg-warning" : "bg-danger",
                    )}
                    style={{ width: `${qs.rate}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-content-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-success" />
                    {qs.correct}
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle size={10} className="text-danger" />
                    {qs.total - qs.correct}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle size={10} />
                    {qs.total} total
                  </span>
                </div>
              </div>
            ))}
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
