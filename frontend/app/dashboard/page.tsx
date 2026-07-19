import { mockStudents } from "@/data/mock/students"
import { mockCourses } from "@/data/mock/courses"
import { mockExams } from "@/data/mock/exams"
import { DashboardPageClient } from "./page-client"

export default function DashboardPage() {
  const stats = [
    { label: "Total Students", value: mockStudents.length, change: "+12%", icon: "users" },
    { label: "Active Courses", value: mockCourses.filter((c) => c.status === "active").length, change: "+2", icon: "book-open" },
    { label: "Upcoming Exams", value: mockExams.filter((e) => e.status === "scheduled").length, change: "", icon: "clipboard-list" },
    { label: "Pass Rate", value: "87%", change: "+5%", icon: "bar-chart-3" },
  ]

  return (
    <DashboardPageClient
      stats={stats}
      recentExams={mockExams.slice(0, 4)}
      activeCourses={mockCourses.filter((c) => c.status === "active").slice(0, 3)}
    />
  )
}
