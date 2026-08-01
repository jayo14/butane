"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  ArrowRight,
  Loader2,
  Sparkles,
  ClipboardCheck,
  MessageSquare,
  Archive,
  BookOpen,
  Settings,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export function FinalReviewDashboardClient() {
  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all")

  useEffect(() => {
    Promise.all([
      api.academics.reportCardsList({ page_size: 500 }).catch(() => ({ results: [] })),
      api.academics.classrooms().catch(() => ({ results: [] })),
    ]).then(([reportsRes, classRes]) => {
      setReportCards((reportsRes as any)?.results || reportsRes || [])
      setClassrooms((classRes as any)?.results || classRes || [])
    }).finally(() => setLoading(false))
  }, [])

  const totalStudents = reportCards.length
  const approvedCount = reportCards.filter((r: any) => r.status === "approved").length
  const pendingCount = reportCards.filter((r: any) => r.status === "submitted" || r.status === "draft").length
  const draftCount = reportCards.filter((r: any) => r.status === "draft").length

  const avgScore = reportCards.length > 0
    ? reportCards.reduce((sum: number, r: any) => sum + (r.average_score || 0), 0) / reportCards.length
    : 0

  const scoreDistribution = [
    { range: "70-100", label: "Excellent", color: "bg-success", count: reportCards.filter((r: any) => r.average_score >= 70).length },
    { range: "60-69", label: "Very Good", color: "bg-primary", count: reportCards.filter((r: any) => r.average_score >= 60 && r.average_score < 70).length },
    { range: "50-59", label: "Good", color: "bg-primary/70", count: reportCards.filter((r: any) => r.average_score >= 50 && r.average_score < 60).length },
    { range: "40-49", label: "Pass", color: "bg-warning", count: reportCards.filter((r: any) => r.average_score >= 40 && r.average_score < 50).length },
    { range: "0-39", label: "Fail", color: "bg-danger", count: reportCards.filter((r: any) => r.average_score < 40).length },
  ].map((d) => ({
    ...d,
    percentage: totalStudents > 0 ? Math.round((d.count / totalStudents) * 100) : 0,
  }))

  const unfinishedBusiness = [
    draftCount > 0 && { id: 1, task: `${draftCount} report cards need generation`, status: "not_started", priority: "high" },
    pendingCount > 0 && { id: 2, task: `${pendingCount} reports pending approval`, status: "pending_review", priority: "medium" },
    classrooms.length > 0 && { id: 3, task: `${classrooms.length} active classrooms`, status: "in_progress", priority: "low" },
  ].filter(Boolean) as any[]

  const kpiData = [
    { label: "Total Reports", value: totalStudents.toString(), trend: "up" as const, icon: Users, color: "primary" },
    { label: "Approved", value: approvedCount.toString(), trend: "up" as const, icon: CheckCircle, color: "success" },
    { label: "Pending Review", value: pendingCount.toString(), trend: "down" as const, icon: Clock, color: "warning" },
    { label: "Avg Score", value: `${avgScore.toFixed(1)}%`, trend: "up" as const, icon: BarChart3, color: "primary" },
  ]

  const filteredTasks = unfinishedBusiness.filter(
    (t) => activeFilter === "all" || t.priority === activeFilter
  )

  return (
    <Container>
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
          <span>/</span>
          <span className="text-primary font-bold">Review Dashboard</span>
        </nav>
        <h1 className="text-4xl text-primary font-bold tracking-tight">Final Review Dashboard</h1>
        <p className="text-content-secondary mt-2 max-w-xl">
          Overview of report card generation progress, pending tasks, and score distribution.
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-3 text-content-secondary">Loading dashboard data...</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white p-6 rounded-3xl shadow-card border border-border-primary/60 hover:shadow-dropdown hover:scale-[1.02] transition-all relative overflow-hidden group"
          >
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  kpi.color === "primary" && "bg-primary/10 text-primary",
                  kpi.color === "success" && "bg-success/10 text-success",
                  kpi.color === "warning" && "bg-warning/10 text-warning",
                )}>
                  <kpi.icon size={20} />
                </div>
              </div>
              <p className="text-3xl text-content-primary font-bold mb-1">{kpi.value}</p>
              <p className="text-xs text-content-secondary">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Unfinished Business */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                    <AlertTriangle size={20} />
                  </div>
                  <h2 className="text-xl text-content-primary font-bold">Unfinished Business</h2>
                </div>
                <div className="flex items-center gap-2">
                  {(["all", "high", "medium", "low"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                        activeFilter === filter
                          ? "bg-primary text-white"
                          : "bg-surface-secondary text-content-secondary hover:bg-primary/5"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary/30 border border-border-primary/10 hover:border-primary/20 hover:shadow-sm transition-all group"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      task.status === "not_started" && "bg-content-secondary",
                      task.status === "in_progress" && "bg-warning",
                      task.status === "pending_review" && "bg-primary",
                      task.status === "rejected" && "bg-danger",
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-content-primary truncate">{task.task}</p>
                      <p className="text-xs text-content-secondary capitalize">
                        {task.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                      task.priority === "high" && "bg-danger/10 text-danger",
                      task.priority === "medium" && "bg-warning/10 text-warning",
                      task.priority === "low" && "bg-surface-secondary text-content-secondary",
                    )}>
                      {task.priority}
                    </span>
                    <button className="text-content-secondary hover:text-primary p-2 rounded-xl hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 size={20} />
                </div>
                <h2 className="text-xl text-content-primary font-bold">Score Distribution</h2>
              </div>

              <div className="space-y-4">
                {scoreDistribution.map((dist) => (
                  <div key={dist.range} className="flex items-center gap-4">
                    <div className="w-20 text-right">
                      <p className="text-xs font-bold text-content-primary">{dist.range}</p>
                      <p className="text-[10px] text-content-secondary">{dist.label}</p>
                    </div>
                    <div className="flex-1 h-8 bg-surface-secondary rounded-xl overflow-hidden">
                      <div
                        className={cn("h-full rounded-xl transition-all duration-1000", dist.color)}
                        style={{ width: `${dist.percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <p className="text-sm font-bold text-content-primary">{dist.count}</p>
                      <p className="text-[10px] text-content-secondary">{dist.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Summary Stats */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <h2 className="text-xl text-content-primary font-bold mb-6">Classroom Summary</h2>
              <div className="space-y-3">
                {classrooms.slice(0, 6).map((classroom: any) => {
                  const classReports = reportCards.filter((r: any) => r.classroom === classroom.id)
                  const approved = classReports.filter((r: any) => r.status === "approved").length
                  return (
                    <div key={classroom.id} className="flex items-center justify-between p-3 bg-surface-secondary/30 rounded-xl">
                      <span className="text-sm font-bold text-content-primary">{classroom.name}</span>
                      <span className="text-xs text-content-secondary">{approved}/{classReports.length} approved</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <h2 className="text-xl text-content-primary font-bold mb-6">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/dashboard/report-cards/generate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group">
                  <Sparkles size={16} className="text-content-secondary group-hover:text-primary" />
                  <span className="text-sm font-bold text-content-primary group-hover:text-primary">Generate Reports</span>
                </Link>
                <Link href="/dashboard/report-cards/approval" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group">
                  <ClipboardCheck size={16} className="text-content-secondary group-hover:text-primary" />
                  <span className="text-sm font-bold text-content-primary group-hover:text-primary">Review & Approve</span>
                </Link>
                <Link href="/dashboard/report-cards/remarks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group">
                  <MessageSquare size={16} className="text-content-secondary group-hover:text-primary" />
                  <span className="text-sm font-bold text-content-primary group-hover:text-primary">Write Remarks</span>
                </Link>
                <Link href="/dashboard/report-cards/archive" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group">
                  <Archive size={16} className="text-content-secondary group-hover:text-primary" />
                  <span className="text-sm font-bold text-content-primary group-hover:text-primary">View Archive</span>
                </Link>
                <Link href="/dashboard/report-cards/mark-sheet" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group">
                  <BookOpen size={16} className="text-content-secondary group-hover:text-primary" />
                  <span className="text-sm font-bold text-content-primary group-hover:text-primary">Mark Sheet</span>
                </Link>
                <Link href="/dashboard/report-cards/customize" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group">
                  <Settings size={16} className="text-content-secondary group-hover:text-primary" />
                  <span className="text-sm font-bold text-content-primary group-hover:text-primary">Customize</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Container>
  )
}
