import type { NavItem } from "@/types"

export const APP_NAME = "Dee Soar School"
export const APP_DESCRIPTION = "CBT Management System"

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { label: "Students", href: "/dashboard/students", icon: "users" },
  { label: "Courses", href: "/dashboard/courses", icon: "book-open" },
  { label: "Exams", href: "/dashboard/exams", icon: "clipboard-list" },
  { label: "Results", href: "/dashboard/results", icon: "bar-chart-3" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
]

export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

export const GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
] as const

export const EXAM_STATUS = ["draft", "scheduled", "ongoing", "completed", "cancelled"] as const

export const STUDENT_STATUS = ["active", "inactive", "suspended"] as const

export const COURSE_STATUS = ["active", "archived"] as const
