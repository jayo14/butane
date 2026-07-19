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
  date: string
  duration: number
  totalMarks: number
  passingMarks: number
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
  questionCount: number
  enrolledStudents: number
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

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}
