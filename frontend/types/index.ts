export type Size = "sm" | "md" | "lg"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"

export type BadgeVariant = "primary" | "success" | "warning" | "danger" | "info" | "mint" | "pink"

export type AlertVariant = "info" | "success" | "warning" | "error"

export type ProgressVariant = "primary" | "success" | "warning" | "danger" | "info"

export type ToastVariant = "success" | "error" | "warning" | "info"

export type DrawerPlacement = "left" | "right"

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "teacher" | "student"
  avatar?: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  grade: string
  status: "active" | "inactive" | "suspended"
  enrollmentDate: string
  avatar?: string
}

export interface Course {
  id: string
  code: string
  name: string
  description: string
  teacher: string
  credits: number
  students: number
  status: "active" | "archived"
  schedule: string
}

export interface Exam {
  id: string
  title: string
  course: string
  courseCode: string
  subject: string
  date: string
  duration: number
  totalMarks: number
  passingMarks: number
  status: "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"
  questionCount: number
  enrolledStudents: number
  shortCode?: string
  isPublic?: boolean
  createdBy?: string
}

export interface Toast {
  id: string
  message: string
  description?: string
  variant: ToastVariant
  duration?: number
}

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  align?: "left" | "center" | "right"
}

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface StudentResultSummary {
  totalExams: number
  completedExams: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  rank: number
}

export interface ExamAttempt {
  id: string
  attemptId?: string
  examId: string
  examTitle: string
  subject: string
  date: string
  score: number
  totalMarks: number
  passed: boolean
  duration: number
  studentName: string
  studentGrade?: string
}

export interface StudentWithResults {
  id: string
  firstName: string
  lastName: string
  email: string
  grade: string
  status: "active" | "inactive" | "suspended"
  avatar?: string
  summary: StudentResultSummary
  attempts: ExamAttempt[]
}

export interface ReportCardHistoryItem {
  id: string
  session: string | null
  session_name?: string
  term: string | null
  term_name?: string
  classroom: string | null
  classroom_name?: string
  average_score?: number | null
  average?: number | null
  position?: number | null
  grade?: string | null
}

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  roles?: ("admin" | "teacher")[]
  children?: NavItem[]
}

export interface RosterRow {
  index: number
  full_name: string
  guardian_phone: string
  guardian_email: string
  existing_id?: string
}

export interface RosterImportResponse {
  classroom: string
  new_rows: RosterRow[]
  duplicate_rows: RosterRow[]
}

export interface RosterEntry {
  id: string
  school: string
  classroom: string
  classroom_name: string
  full_name: string
  guardian_phone: string
  guardian_email: string
  status: "draft" | "invited" | "claimed"
  promoted_student: string | null
  created_at: string
  updated_at: string
}
