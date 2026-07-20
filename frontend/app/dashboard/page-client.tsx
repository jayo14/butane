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
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import type { DashboardData } from "./types"

const statIconMap: Record<string, React.ReactNode> = {
  users: <Users size={22} />,
  "book-open": <BookOpen size={22} />,
  "clipboard-list": <ClipboardList size={22} />,
  "bar-chart-3": <BarChart3 size={22} />,
}

const activityIconMap: Record<string, React.ReactNode> = {
  exam_created: <FileText size={16} className="text-primary" />,
  result_published: <Award size={16} className="text-success" />,
  student_enrolled: <UserPlus size={16} className="text-info" />,
  course_updated: <BookOpen size={16} className="text-warning" />,
  grade_submitted: <TrendingUp size={16} className="text-primary" />,
}

export function DashboardPageClient({ data }: { data: DashboardData | null }) {
  const [showAllActivity, setShowAllActivity] = useState(false)

  if (!data) {
    return (
      <Container>
        <EmptyState
          icon={<GraduationCap size={48} />}
          title="Welcome to Dee Soar School"
          description="Get started by creating your first exam or adding students to the system."
          action={
            <Link href="/dashboard/exams/create">
              <Button variant="primary" leftIcon={<Plus size={20} />} size="lg">
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
      {/* Hero Banner */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-24 -top-24 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              <Zap size={14} />
              <span>Dashboard Overview</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Welcome back, {data.teacher.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-base text-white/80 leading-relaxed">
              Here&apos;s what&apos;s happening at Dee Soar School today. Manage exams, track student progress, and monitor performance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/exams/create">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Plus size={20} />}
                  className="bg-white text-primary hover:bg-white/90 shadow-lg"
                >
                  Create Exam
                </Button>
              </Link>
              <Link href="/dashboard/reports">
                <Button
                  variant="outline"
                  size="lg"
                  rightIcon={<ArrowRight size={20} />}
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                >
                  View Reports
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex size-32 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
            <GraduationCap size={56} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Stats Row - Large Clickable Cards */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat, i) => (
          <Card
            key={stat.label}
            padding="lg"
            hover
            gradient
            className="group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15 group-hover:shadow-sm group-hover:shadow-primary/20">
                {statIconMap[stat.icon]}
              </div>
              {stat.change && (
                <Badge variant={stat.trend === "up" ? "success" : "danger"} size="md">
                  <span className="flex items-center gap-1">
                    {stat.trend === "up" ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                    {stat.change}
                  </span>
                </Badge>
              )}
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-content-secondary">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-content-primary">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2/3) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Upcoming Exams */}
          <Card padding="lg" gradient>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-content-primary">Upcoming Exams</h2>
                <p className="mt-1 text-sm text-content-secondary">Scheduled and ongoing assessments</p>
              </div>
              <Link href="/dashboard/exams">
                <Button variant="ghost" size="md" rightIcon={<ChevronRight size={18} />}>
                  View All
                </Button>
              </Link>
            </div>
            {data.upcomingExams.length === 0 ? (
              <div className="rounded-2xl bg-surface-secondary/50 p-10 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ClipboardList size={28} />
                </div>
                <p className="text-base font-semibold text-content-primary">No upcoming exams</p>
                <p className="mt-1 text-sm text-content-secondary">Schedule your first exam to get started.</p>
                <Link href="/dashboard/exams/create" className="mt-4 inline-block">
                  <Button size="md" leftIcon={<Plus size={18} />}>Schedule Exam</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.upcomingExams.map((exam, i) => (
                  <Link
                    key={exam.id}
                    href={`/dashboard/exams/${exam.id}`}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl border-2 border-border-primary/60 bg-white p-5 transition-all duration-300",
                      "hover:border-primary/30 hover:shadow-dropdown hover:-translate-y-0.5",
                    )}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-content-primary group-hover:text-primary transition-colors">
                          {exam.title}
                        </p>
                        <p className="mt-1 text-sm text-content-secondary">
                          {exam.course} &middot; {exam.enrolledStudents} students
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-content-muted">
                          <Clock size={13} />
                          {exam.date} at {exam.time}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        exam.status === "scheduled" ? "info" :
                        exam.status === "ongoing" ? "warning" : "success"
                      }
                      size="md"
                    >
                      {exam.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card padding="lg" gradient>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-content-primary">Quick Actions</h2>
              <p className="mt-1 text-sm text-content-secondary">Common tasks and shortcuts</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.quickActions.map((action, i) => {
                const actionIconMap: Record<string, React.ReactNode> = {
                  "plus": <Plus size={24} />,
                  "user-plus": <UserPlus size={24} />,
                  "file-text": <FileText size={24} />,
                  "settings": <Settings size={24} />,
                }
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "group flex items-center gap-5 rounded-2xl border-2 border-border-primary/60 bg-white p-6 transition-all duration-300",
                      "hover:border-primary/30 hover:shadow-dropdown hover:-translate-y-0.5",
                    )}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm group-hover:shadow-primary/20">
                      {actionIconMap[action.icon]}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-content-primary group-hover:text-primary transition-colors">
                        {action.label}
                      </p>
                      <p className="mt-0.5 text-sm text-content-muted">{action.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-content-muted group-hover:text-primary transition-colors" />
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          {/* Teacher Profile Card */}
          <Card padding="lg" gradient className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/30">
              <GraduationCap size={40} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-content-primary">{data.teacher.name}</h2>
            <Badge variant="primary" size="md" className="mt-2">{data.teacher.role}</Badge>
            <p className="mt-1 text-sm text-content-muted">{data.teacher.department}</p>

            <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl bg-surface-secondary/80 p-4">
              {[
                { label: "Students", value: data.teacher.totalStudents },
                { label: "Courses", value: data.teacher.totalCourses },
                { label: "Pass Rate", value: `${data.teacher.passRate}%` },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-lg font-bold text-content-primary">{item.value}</p>
                  <p className="text-xs text-content-muted">{item.label}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/profile" className="mt-5 block">
              <Button variant="outline" size="md" className="w-full" rightIcon={<ChevronRight size={18} />}>
                View Profile
              </Button>
            </Link>
          </Card>

          {/* Recent Activity */}
          <Card padding="lg" gradient>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-content-primary">Activity</h2>
                <p className="mt-0.5 text-sm text-content-secondary">Latest updates</p>
              </div>
              {data.recentActivity.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllActivity(!showAllActivity)}
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  {showAllActivity ? "Less" : "All"}
                </button>
              )}
            </div>
            {data.recentActivity.length === 0 ? (
              <div className="py-6 text-center">
                <Bell size={28} className="mx-auto text-content-muted" />
                <p className="mt-2 text-sm text-content-muted">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-0">
                {displayActivity.map((item, i) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 border-l-[3px] py-4 pl-5 transition-all duration-200 hover:pl-6",
                      i === 0 ? "border-primary bg-primary/[0.02]" : "border-border-primary/60",
                    )}
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
                      {activityIconMap[item.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-content-primary leading-relaxed">
                        <span className="font-semibold">{item.user}</span> {item.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-content-muted">
                        <Clock size={11} />
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tip Card */}
          <Card padding="lg" className="bg-gradient-to-br from-primary/10 via-primary/5 to-white border-primary/20">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-base font-semibold text-content-primary">Pro Tip</p>
                <p className="mt-1 text-sm text-content-secondary leading-relaxed">
                  Use the Create Exam wizard to set up computer-based tests with automated grading in minutes.
                </p>
                <Link href="/dashboard/exams/create" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                  Try it now <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  )
}
