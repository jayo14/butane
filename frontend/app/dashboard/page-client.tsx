"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Users, BookOpen, ClipboardList, BarChart3 } from "lucide-react"

const iconMap: Record<string, React.ReactNode> = {
  users: <Users size={20} />,
  "book-open": <BookOpen size={20} />,
  "clipboard-list": <ClipboardList size={20} />,
  "bar-chart-3": <BarChart3 size={20} />,
}

interface StatCard {
  label: string
  value: string | number
  change: string
  icon: string
}

interface Exam {
  id: string
  title: string
  courseCode: string
  date: string
  status: string
  enrolledStudents: number
}

interface Course {
  id: string
  code: string
  name: string
  teacher: string
  students: number
  schedule: string
}

interface DashboardPageClientProps {
  stats: StatCard[]
  recentExams: Exam[]
  activeCourses: Course[]
}

export function DashboardPageClient({ stats, recentExams, activeCourses }: DashboardPageClientProps) {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">Dashboard</h1>
        <p className="mt-1 text-content-secondary">
          Welcome back to Dee Soar School CBT Management System
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {iconMap[stat.icon]}
              </div>
              {stat.change && (
                <Badge variant="success" size="sm">
                  {stat.change}
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">Upcoming Exams</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {recentExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between rounded-lg border border-border-primary p-3"
              >
                <div>
                  <p className="text-sm font-medium text-content-primary">{exam.title}</p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    {exam.courseCode} &middot; {exam.enrolledStudents} students
                  </p>
                </div>
                <Badge variant={exam.status === "scheduled" ? "info" : "warning"} size="sm">
                  {exam.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">Active Courses</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {activeCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between rounded-lg border border-border-primary p-3"
              >
                <div>
                  <p className="text-sm font-medium text-content-primary">{course.name}</p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    {course.teacher} &middot; {course.students} students
                  </p>
                </div>
                <span className="text-xs text-content-secondary">{course.schedule}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Container>
  )
}
