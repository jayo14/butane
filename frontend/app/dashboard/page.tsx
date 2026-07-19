import { mockStudents } from "@/data/mock/students"
import { mockCourses } from "@/data/mock/courses"
import { mockExams } from "@/data/mock/exams"
import { DashboardPageClient } from "./page-client"
import type { DashboardData } from "./types"

export default function DashboardPage() {
  const data: DashboardData = {
    stats: [
      { label: "Total Students", value: mockStudents.length, change: "+12%", trend: "up", icon: "users" },
      { label: "Active Courses", value: mockCourses.filter((c) => c.status === "active").length, change: "+2", trend: "up", icon: "book-open" },
      { label: "Upcoming Exams", value: mockExams.filter((e) => e.status === "scheduled").length, change: "", trend: "up", icon: "clipboard-list" },
      { label: "Overall Pass Rate", value: "87%", change: "+5%", trend: "up", icon: "bar-chart-3" },
    ],
    upcomingExams: mockExams
      .filter((e) => e.status === "scheduled" || e.status === "ongoing")
      .map((e) => ({
        id: e.id,
        title: e.title,
        course: e.course,
        date: "Oct 15, 2026",
        time: "09:00 AM",
        status: e.status,
        enrolledStudents: e.enrolledStudents,
      })),
    recentActivity: [
      { id: "1", type: "exam_created" as const, message: "created a new exam: Algebra I - Midterm", time: "2 hours ago", user: "Dr. Sarah Mitchell" },
      { id: "2", type: "result_published" as const, message: "published results for Biology - Chapter 5 Test", time: "4 hours ago", user: "Dr. Emily Chen" },
      { id: "3", type: "student_enrolled" as const, message: "enrolled in Computer Science Intro", time: "6 hours ago", user: "Grace Lee" },
      { id: "4", type: "course_updated" as const, message: "updated syllabus for English Literature", time: "1 day ago", user: "Prof. James Anderson" },
      { id: "5", type: "grade_submitted" as const, message: "submitted grades for Physics - Mechanics", time: "1 day ago", user: "Dr. Robert Kim" },
      { id: "6", type: "exam_created" as const, message: "created quiz for World History", time: "2 days ago", user: "Prof. Maria Garcia" },
    ],
    teacher: {
      name: "Dr. Sarah Mitchell",
      email: "sarah.mitchell@deesoar.edu",
      role: "Head of Mathematics",
      department: "Science Department",
      totalStudents: mockStudents.length,
      totalCourses: mockCourses.filter((c) => c.status === "active").length,
      passRate: 87,
    },
    quickActions: [
      { label: "Create Exam", href: "/dashboard/exams/create", icon: "plus", description: "New CBT assessment" },
      { label: "Add Student", href: "/dashboard/students/add", icon: "user-plus", description: "Enroll new student" },
      { label: "View Reports", href: "/dashboard/results", icon: "file-text", description: "Analytics & grades" },
      { label: "Settings", href: "/dashboard/settings", icon: "settings", description: "System configuration" },
    ],
  }

  return <DashboardPageClient data={data} />
}
