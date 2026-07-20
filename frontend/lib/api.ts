const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/api/${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.detail || body.message || res.statusText)
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return ""
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

// ---- Backend API response shapes (snake_case) ----

export interface ApiUser {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: "admin" | "teacher" | "student"
  is_active: boolean
}

export interface ApiStudent {
  id: string
  user: ApiUser
  full_name: string
  student_id: string
  phone: string
  grade: string
  status: "active" | "inactive" | "suspended"
  enrollment_date: string
  avatar: string | null
}

export interface ApiTeacher {
  id: string
  user: ApiUser
  full_name: string
  department: string
  title: string
}

export interface ApiExam {
  id: string
  title: string
  course: string
  course_code: string
  subject: string
  class_group: string
  term: string
  status: "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"
  duration_minutes: number
  total_marks: number
  passing_marks: number
  passing_percentage: number
  is_public: boolean
  created_by: string
  question_count: number
  created_at: string
  published_at: string | null
  description?: string
  instructions?: string
  available_from?: string
  available_to?: string
  shuffle_questions?: boolean
  shuffle_answers?: boolean
  show_result?: boolean
  allow_review?: boolean
  public_url?: string
}

export interface ApiQuestion {
  id: string
  exam: string
  order: number
  text: string
  type: "single_choice" | "multiple_choice" | "true_false"
  marks: number
  explanation: string
  choices: { id: string; label: string; text: string; is_correct: boolean }[]
}

export interface ApiAttempt {
  id: string
  exam: string
  student: string
  student_name: string
  status: "in_progress" | "submitted" | "graded" | "abandoned"
  started_at: string
  submitted_at: string | null
  duration_seconds: number
}

export interface ApiResult {
  id: string
  attempt: string
  exam: string
  student: string
  student_name: string
  exam_title: string
  course: string
  score: number
  total_marks: number
  percentage: number
  passed: boolean
  correct_count: number
  incorrect_count: number
  unanswered_count: number
  graded_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ---- Frontend-friendly types (camelCase) ----

export interface ExamSummary {
  id: string
  title: string
  course: string
  courseCode: string
  date: string
  duration: number
  totalMarks: number
  passingMarks: number
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "draft"
  questionCount: number
  enrolledStudents: number
}

export interface StudentSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  grade: string
  status: "active" | "inactive" | "suspended"
  enrollmentDate: string
  studentId: string
}

export interface AttemptSummary {
  id: string
  examId: string
  examTitle: string
  course: string
  date: string
  score: number
  totalMarks: number
  passed: boolean
  duration: number
  studentName?: string
  studentGrade?: string
}

// ---- Transform functions ----

export function transformExam(api: ApiExam): ExamSummary {
  return {
    id: api.id,
    title: api.title,
    course: api.course,
    courseCode: api.course_code,
    date: api.created_at,
    duration: api.duration_minutes,
    totalMarks: api.total_marks,
    passingMarks: api.passing_marks,
    status: api.status === "draft" ? "scheduled" : api.status,
    questionCount: api.question_count,
    enrolledStudents: 0,
  }
}

export function transformStudent(api: ApiStudent): StudentSummary {
  return {
    id: api.id,
    firstName: api.user.first_name,
    lastName: api.user.last_name,
    email: api.user.email,
    grade: api.grade,
    status: api.status,
    enrollmentDate: api.enrollment_date,
    studentId: api.student_id,
  }
}

export function transformAttempt(api: ApiResult, studentName?: string, studentGrade?: string): AttemptSummary {
  return {
    id: api.id,
    examId: api.exam,
    examTitle: api.exam_title || "",
    course: api.course || "",
    date: api.graded_at,
    score: api.score,
    totalMarks: api.total_marks,
    passed: api.passed,
    duration: 0,
    studentName,
    studentGrade,
  }
}

// ---- API functions ----

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ access: string; refresh: string }>("accounts/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => apiFetch<void>("accounts/auth/logout/", { method: "POST" }),
    refresh: (refresh: string) =>
      apiFetch<{ access: string }>("accounts/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),
    me: () => apiFetch<ApiUser>("accounts/me/"),
    profile: () => apiFetch<ApiUser>("accounts/profile/"),
  },

  teachers: {
    list: () => apiFetch<ApiTeacher[]>("accounts/teachers/"),
  },

  students: {
    list: (params?: { grade?: string; status?: string; search?: string }) =>
      apiFetch<ApiStudent[]>(`accounts/students/${buildQuery(params || {})}`),
  },

  exams: {
    list: (params?: { status?: string; search?: string; page?: number }) =>
      apiFetch<PaginatedResponse<ApiExam>>(`exams/${buildQuery(params || {})}`),
    get: (id: string) => apiFetch<ApiExam>(`exams/${id}/`),
    create: (data: Partial<ApiExam>) =>
      apiFetch<ApiExam>("exams/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiExam>) =>
      apiFetch<ApiExam>(`exams/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`exams/${id}/`, { method: "DELETE" }),
    publish: (id: string) => apiFetch<ApiExam>(`exams/${id}/publish/`, { method: "POST" }),
    duplicate: (id: string) => apiFetch<ApiExam>(`exams/${id}/duplicate/`, { method: "POST" }),
    archive: (id: string) => apiFetch<ApiExam>(`exams/${id}/archive/`, { method: "POST" }),
  },

  questions: {
    list: (examId: string) => apiFetch<ApiQuestion[]>(`exams/${examId}/questions/`),
    create: (examId: string, data: Partial<ApiQuestion>) =>
      apiFetch<ApiQuestion>(`exams/${examId}/questions/`, { method: "POST", body: JSON.stringify(data) }),
  },

  attempts: {
    list: (params?: { exam?: string; student?: string }) =>
      apiFetch<PaginatedResponse<ApiAttempt>>(`attempts/${buildQuery(params || {})}`),
    get: (id: string) => apiFetch<ApiAttempt>(`attempts/${id}/`),
  },

  results: {
    list: (params?: { exam?: string; student?: string; passed?: boolean; page?: number }) =>
      apiFetch<PaginatedResponse<ApiResult>>(`results/${buildQuery(params || {})}`),
  },

  reports: {
    examStats: (examId: string) => apiFetch<any>(`reports/exams/${examId}/`),
    questionStats: (examId: string) => apiFetch<any[]>(`reports/exams/${examId}/questions/`),
    studentHistory: (studentId: string) => apiFetch<any>(`reports/students/${studentId}/`),
  },

  health: () => apiFetch<{ status: string; database: string }>("health/"),
}

// ---- Server-side data fetching helpers ----

export async function fetchExams(): Promise<ExamSummary[]> {
  const res = await api.exams.list()
  return res.results.map(transformExam)
}

export async function fetchExam(id: string): Promise<ExamSummary | null> {
  try {
    const api = await apiFetch<ApiExam>(`exams/${id}/`)
    return transformExam(api)
  } catch {
    return null
  }
}

export async function fetchStudents(): Promise<StudentSummary[]> {
  const res = await api.students.list()
  return res.map(transformStudent)
}

export async function fetchExamAttempts(examId: string): Promise<AttemptSummary[]> {
  const res = await api.results.list({ exam: examId })
  return res.results.map((r) => transformAttempt(r))
}
