"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  Plus,
  UserPlus,
  FileText,
  Settings,
  Clock,
  ChevronRight,
  Calendar,
  Award,
  TrendingUp,
  GraduationCap,
  Bell,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import type { DashboardData } from "./types"

const statIconMap: Record<string, React.ReactNode> = {
  users: <Users size={20} />,
  "book-open": <BookOpen size={20} />,
  "clipboard-list": <ClipboardList size={20} />,
  "bar-chart-3": <BarChart3 size={20} />,
}

const activityIconMap: Record<string, React.ReactNode> = {
  exam_created: <FileText size={16} className="text-primary" />,
  result_published: <Award size={16} className="text-success" />,
  student_enrolled: <UserPlus size={16} className="text-info" />,
  course_updated: <BookOpen size={16} className="text-warning" />,
  grade_submitted: <TrendingUp size={16} className="text-primary" />,
}

export function DashboardPageClient({ data, isLoading }: { data: DashboardData | null; isLoading?: boolean }) {
  const [showAllActivity, setShowAllActivity] = useState(false)

  if (isLoading) return null

  if (!data) {
    return (
      <Container>
        <EmptyState
          icon={<GraduationCap size={40} />}
          title="Welcome to Dee Soar School"
          description="Get started by creating your first exam or adding students to the system."
          action={
            <Link href="/dashboard/exams/create">
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                Create Your First Exam
              </Button>
            </Link>
          }
        />
      </Container>
    )
  }

  const displayActivity = showAllActivity ? data.recentActivity : data.recentActivity.slice(0, 5)

  return (
    <Container>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            Welcome back, {data.teacher.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-content-secondary">
            Here&apos;s what&apos;s happening at Dee Soar School today.
          </p>
        </div>
        <Link href="/dashboard/exams/create">
          <Button leftIcon={<Plus size={18} />} className="hidden sm:flex">
            Create Exam
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat, i) => (
          <Card
            key={stat.label}
            padding="lg"
            className="group transition-all duration-200 hover:shadow-dropdown hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15 group-hover:rotate-[4deg]">
                {statIconMap[stat.icon]}
              </div>
              {stat.change && (
                <Badge variant={stat.trend === "up" ? "success" : "danger"} size="sm">
                  <span className="flex items-center gap-0.5">
                    {stat.trend === "up" ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                    {stat.change}
                  </span>
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-content-secondary">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-content-primary">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Upcoming Exams Column */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-content-primary">Upcoming Exams</h2>
              <Link href="/dashboard/exams">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
                  View All
                </Button>
              </Link>
            </div>
            {data.upcomingExams.length === 0 ? (
              <EmptyState
                icon={<ClipboardList size={32} />}
                title="No upcoming exams"
                description="Schedule your first exam to get started."
                action={
                  <Link href="/dashboard/exams/create">
                    <Button size="sm" leftIcon={<Plus size={16} />}>Schedule Exam</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {data.upcomingExams.map((exam, i) => (
                  <Link
                    key={exam.id}
                    href={`/dashboard/exams/${exam.id}`}
                    className={cn(
                      "group flex items-center justify-between rounded-xl border border-border-primary p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-card",
                    )}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary group-hover:text-primary">
                          {exam.title}
                        </p>
                        <p className="mt-0.5 text-xs text-content-secondary">
                          {exam.course} &middot; {exam.enrolledStudents} students
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-content-muted">
                          <Clock size={11} />
                          {exam.date} at {exam.time}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        exam.status === "scheduled" ? "info" :
                        exam.status === "ongoing" ? "warning" : "success"
                      }
                      size="sm"
                    >
                      {exam.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card padding="lg">
            <h2 className="mb-4 text-lg font-semibold text-content-primary">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {data.quickActions.map((action, i) => {
                const actionIconMap: Record<string, React.ReactNode> = {
                  "plus": <Plus size={20} />,
                  "user-plus": <UserPlus size={20} />,
                  "file-text": <FileText size={20} />,
                  "settings": <Settings size={20} />,
                }
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border-primary p-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-card"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/10">
                      {actionIconMap[action.icon]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-content-primary">{action.label}</p>
                      <p className="mt-0.5 text-[11px] text-content-muted">{action.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Teacher Profile */}
          <Card padding="lg">
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-md shadow-primary/20">
                <GraduationCap size={32} />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-content-primary">{data.teacher.name}</h2>
              <p className="text-sm text-content-secondary">{data.teacher.role}</p>
              <p className="text-xs text-content-muted">{data.teacher.department}</p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-surface-secondary p-3">
              {[
                { label: "Students", value: data.teacher.totalStudents },
                { label: "Courses", value: data.teacher.totalCourses },
                { label: "Pass Rate", value: `${data.teacher.passRate}%` },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-sm font-semibold text-content-primary">{item.value}</p>
                  <p className="text-[10px] text-content-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-content-primary">Recent Activity</h2>
              {data.recentActivity.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllActivity(!showAllActivity)}
                  className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  {showAllActivity ? "Show less" : "View all"}
                </button>
              )}
            </div>
            {data.recentActivity.length === 0 ? (
              <EmptyState
                icon={<Bell size={32} />}
                title="No recent activity"
                description="Activity from exams and students will appear here."
              />
            ) : (
              <div className="space-y-0">
                {displayActivity.map((item, i) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 border-l-2 py-3 pl-4",
                      i === 0 ? "border-primary" : "border-border-primary",
                    )}
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                      {activityIconMap[item.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-content-primary">
                        <span className="font-medium">{item.user}</span> {item.message}
                      </p>
                      <p className="mt-0.5 text-xs text-content-muted">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tip Card */}
          <Card padding="lg" className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/10">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-content-primary">Pro Tip</p>
                <p className="mt-0.5 text-xs text-content-secondary">
                  Use the Create Exam wizard to set up computer-based tests with automated grading in minutes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  )
}
