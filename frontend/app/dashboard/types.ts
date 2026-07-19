export interface DashboardData {
  stats: StatCard[]
  upcomingExams: ExamSummary[]
  recentActivity: ActivityItem[]
  teacher: TeacherProfile
  quickActions: QuickAction[]
}

export interface StatCard {
  label: string
  value: string | number
  change: string
  trend: "up" | "down"
  icon: string
}

export interface ExamSummary {
  id: string
  title: string
  course: string
  date: string
  time: string
  status: string
  enrolledStudents: number
}

export interface ActivityItem {
  id: string
  type: "exam_created" | "result_published" | "student_enrolled" | "course_updated" | "grade_submitted"
  message: string
  time: string
  user: string
}

export interface TeacherProfile {
  name: string
  email: string
  role: string
  department: string
  totalStudents: number
  totalCourses: number
  passRate: number
}

export interface QuickAction {
  label: string
  href: string
  icon: string
  description: string
}
