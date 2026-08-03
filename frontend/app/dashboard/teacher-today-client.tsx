"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ClipboardCheck,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  BookOpen,
  Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"

interface GradingTask {
  id: string
  component_name: string
  component_type: string
  max_score: number
  classroom_id: string
  classroom_name: string
  subject_id: string
  subject_name: string
  scored_count: number
  enrolled_count: number
  missing_count: number
}

interface TodayExam {
  id: string
  title: string
  subject: string
  class_group: string
  status: string
  duration_minutes: number
  available_from: string | null
}

export function TeacherTodayClient() {
  const [tasks, setTasks] = useState<GradingTask[]>([])
  const [exams, setExams] = useState<TodayExam[]>([])
  const [loading, setLoading] = useState(true)
  const [examsLoading, setExamsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch<any[]>("academics/teaching-assignments/grading-tasks/")
        if (!cancelled) setTasks(Array.isArray(res) ? res : [])
      } catch {
        if (!cancelled) setTasks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch<any>("exams/?page_size=20")
        const all = (res?.results || []) as TodayExam[]
        const today = new Date().toISOString().split("T")[0]
        const active = all.filter((e) =>
          (e.status === "scheduled" || e.status === "ongoing") &&
          (!e.available_from || e.available_from.split("T")[0] <= today)
        )
        if (!cancelled) setExams(active.slice(0, 5))
      } catch {
        if (!cancelled) setExams([])
      } finally {
        if (!cancelled) setExamsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const totalMissing = tasks.reduce((sum, t) => sum + t.missing_count, 0)

  return (
    <div className="space-y-8">
      {/* Pending Grading Tasks */}
      <Card padding="lg" gradient>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-content-primary">Pending Grading</h2>
              <p className="mt-0.5 text-sm text-content-secondary">
                {tasks.length === 0
                  ? "All caught up!"
                  : `${tasks.length} component${tasks.length === 1 ? "" : "s"} need${tasks.length === 1 ? "s" : ""} scores — ${totalMissing} missing`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl bg-surface-secondary/50 p-10 text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle size={28} />
            </div>
            <p className="text-base font-semibold text-content-primary">All scores entered</p>
            <p className="mt-1 text-sm text-content-secondary">No pending grading tasks for your classes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <Link
                key={task.id}
                href={`/dashboard/grading?tab=score-entry&classroom=${task.classroom_id}&subject=${task.subject_id}`}
                className={cn(
                  "group flex items-center justify-between rounded-2xl border-2 border-border-primary/60 bg-white p-4 transition-all duration-300",
                  "hover:border-primary/30 hover:shadow-dropdown hover:-translate-y-0.5",
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-content-primary group-hover:text-primary transition-colors">
                      {task.component_name}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {task.classroom_name} · {task.subject_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-content-secondary">
                      {task.scored_count}/{task.enrolled_count} scored
                    </p>
                    <Badge variant="warning" size="sm">
                      {task.missing_count} missing
                    </Badge>
                  </div>
                  <ArrowRight size={16} className="text-content-secondary group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Today's Exams */}
      <Card padding="lg" gradient>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-info/10 text-info">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-content-primary">Today&apos;s Exams</h2>
              <p className="mt-0.5 text-sm text-content-secondary">
                {exams.length === 0 ? "No exams scheduled" : `${exams.length} active exam${exams.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </div>

        {examsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-2xl bg-surface-secondary/50 p-10 text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar size={28} />
            </div>
            <p className="text-base font-semibold text-content-primary">No exams today</p>
            <p className="mt-1 text-sm text-content-secondary">Create an exam to get started.</p>
            <Link href="/dashboard/exams/create" className="mt-4 inline-block">
              <Button size="md" leftIcon={<ClipboardCheck size={16} />}>Create Exam</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam, i) => (
              <Link
                key={exam.id}
                href={`/dashboard/exams/${exam.id}`}
                className={cn(
                  "group flex items-center justify-between rounded-2xl border-2 border-border-primary/60 bg-white p-4 transition-all duration-300",
                  "hover:border-primary/30 hover:shadow-dropdown hover:-translate-y-0.5",
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-content-primary group-hover:text-primary transition-colors">
                      {exam.title}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {exam.subject || exam.class_group || "General"}
                      {exam.duration_minutes ? ` · ${exam.duration_minutes} min` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={exam.status === "ongoing" ? "success" : "info"} size="sm">
                    {exam.status}
                  </Badge>
                  <ArrowRight size={16} className="text-content-secondary group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-content-muted mb-4">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/grading?tab=score-entry"
            className="flex items-center gap-3 rounded-xl border border-border-primary/40 bg-surface-secondary/30 p-4 hover:bg-primary/5 hover:border-primary/20 transition-all"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-content-primary">Enter Scores</p>
              <p className="text-xs text-content-secondary">Mark sheet & grading</p>
            </div>
          </Link>
          <Link
            href="/dashboard/report-cards"
            className="flex items-center gap-3 rounded-xl border border-border-primary/40 bg-surface-secondary/30 p-4 hover:bg-primary/5 hover:border-primary/20 transition-all"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-content-primary">Report Cards</p>
              <p className="text-xs text-content-secondary">Generate & approve</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
