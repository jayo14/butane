import { api, transformStudent, transformExam } from "@/lib/api"
import { DashboardPageClient } from "./page-client"
import type { DashboardData } from "./types"

export default async function DashboardPage() {
  try {
    const [studentsRes, examsRes, profile] = await Promise.all([
      api.students.list(),
      api.exams.list(),
      api.auth.profile().catch(() => null),
    ])

    const students = (studentsRes?.results || []).map(transformStudent)
    const exams = (examsRes?.results || []).map(transformExam)
    const activeCourses = new Set(exams.map((e) => e.course)).size

    const scheduled = exams.filter((e) => e.status === "scheduled" || e.status === "ongoing")

    const data: DashboardData = {
      stats: [
        { label: "Total Students", value: students.length, change: "", trend: "up", icon: "users" },
        { label: "Active Courses", value: activeCourses, change: "", trend: "up", icon: "book-open" },
        { label: "Upcoming Exams", value: scheduled.length, change: "", trend: "up", icon: "clipboard-list" },
        { label: "Total Exams", value: exams.length, change: "", trend: "up", icon: "bar-chart-3" },
      ],
      upcomingExams: scheduled.map((e) => ({
        id: e.id,
        title: e.title,
        course: e.course,
        date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date(e.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        status: e.status,
        enrolledStudents: e.enrolledStudents,
      })),
      recentActivity: [
        { id: "1", type: "exam_created" as const, message: `System ready — ${exams.length} exams available`, time: "Just now", user: "System" },
        { id: "2", type: "student_enrolled" as const, message: `${students.length} students enrolled across ${activeCourses} courses`, time: "Now", user: "System" },
      ],
      teacher: {
        name: profile?.full_name || "Teacher",
        email: profile?.user?.email || "",
        role: profile?.user?.role || "teacher",
        department: "Academic Department",
        totalStudents: students.length,
        totalCourses: activeCourses,
        passRate: 0,
      },
      quickActions: [
        { label: "Create Exam", href: "/dashboard/exams/create", icon: "plus", description: "New CBT assessment" },
        { label: "View Students", href: "/dashboard/students", icon: "user-plus", description: "Manage enrollment" },
        { label: "View Reports", href: "/dashboard/reports", icon: "file-text", description: "Analytics & grades" },
        { label: "Settings", href: "/dashboard/settings", icon: "settings", description: "System configuration" },
      ],
    }

    return <DashboardPageClient data={data} />
  } catch {
    return <DashboardPageClient data={null} />
  }
}
