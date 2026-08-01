"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  Sparkles,
  Archive,
  ClipboardCheck,
  MessageSquare,
  Settings,
  BookOpen,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

const KPI_DATA = [
  { label: "Total Students", value: "247", change: "+12", trend: "up", icon: Users, color: "primary" },
  { label: "Reports Generated", value: "189", change: "+45", trend: "up", icon: FileText, color: "success" },
  { label: "Pending Approval", value: "38", change: "-8", trend: "down", icon: Clock, color: "warning" },
  { label: "Approved", value: "151", change: "+53", trend: "up", icon: CheckCircle, color: "success" },
]

const UNFINISHED_BUSINESS = [
  { id: 1, task: "Generate reports for SS 2A", status: "not_started", priority: "high" },
  { id: 2, task: "Write remarks for JSS 1B (12 students)", status: "in_progress", priority: "high" },
  { id: 3, task: "Approve JSS 2A reports", status: "pending_review", priority: "medium" },
  { id: 4, task: "Review rejected SS 1B reports", status: "rejected", priority: "high" },
  { id: 5, task: "Customize report card template", status: "in_progress", priority: "low" },
]

const SCORE_DISTRIBUTION = [
  { range: "70-100", label: "Excellent", count: 45, percentage: 18, color: "bg-success" },
  { range: "60-69", label: "Very Good", count: 62, percentage: 25, color: "bg-primary" },
  { range: "50-59", label: "Good", count: 78, percentage: 32, color: "bg-primary/70" },
  { range: "40-49", label: "Pass", count: 41, percentage: 17, color: "bg-warning" },
  { range: "0-39", label: "Fail", count: 21, percentage: 8, color: "bg-danger" },
]

const RECENT_ACTIVITY = [
  { id: 1, action: "Reports approved", detail: "JSS 1B - 38 reports", time: "10 min ago", icon: CheckCircle, color: "success" },
  { id: 2, action: "Remarks written", detail: "Mrs. Okonkwo completed JSS 2A", time: "25 min ago", icon: MessageSquare, color: "primary" },
  { id: 3, action: "Report rejected", detail: "SS 1B - Missing CA scores", time: "1 hour ago", icon: AlertTriangle, color: "danger" },
  { id: 4, action: "Reports generated", detail: "JSS 1A - 42 reports", time: "2 hours ago", icon: FileText, color: "primary" },
]

export function FinalReviewDashboardClient() {
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all")

  const filteredTasks = UNFINISHED_BUSINESS.filter(
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_DATA.map((kpi) => (
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
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  kpi.trend === "up" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                )}>
                  {kpi.trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-3xl text-content-primary font-bold mb-1">{kpi.value}</p>
              <p className="text-xs text-content-secondary">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

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
                {SCORE_DISTRIBUTION.map((dist) => (
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
          {/* Recent Activity */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <h2 className="text-xl text-content-primary font-bold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {RECENT_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 group">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      activity.color === "success" && "bg-success/10 text-success",
                      activity.color === "primary" && "bg-primary/10 text-primary",
                      activity.color === "danger" && "bg-danger/10 text-danger",
                    )}>
                      <activity.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-content-primary">{activity.action}</p>
                      <p className="text-xs text-content-secondary truncate">{activity.detail}</p>
                    </div>
                    <span className="text-[10px] text-content-secondary shrink-0">{activity.time}</span>
                  </div>
                ))}
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
