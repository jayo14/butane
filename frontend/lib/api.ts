const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function extractMessage(body: any, statusText: string): { message: string; code?: string } {
  if (!body || typeof body !== "object") {
    return { message: statusText }
  }

  if (body.error && typeof body.error === "object") {
    return {
      message: body.error.message || body.error.detail || statusText,
      code: body.error.code,
    }
  }

  if (body.detail) {
    return { message: body.detail }
  }

  if (body.message) {
    return { message: body.message }
  }

  const firstVal = Object.values(body)[0]
  if (Array.isArray(firstVal)) {
    return { message: String(firstVal[0]) }
  }
  if (typeof firstVal === "string") {
    return { message: firstVal }
  }

  return { message: statusText }
}

const REFRESH_ENDPOINT = "accounts/auth/refresh/"
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

function dispatchAuthExpired() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("auth:expired"))
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

function setAccessToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("access_token", token)
}

function setRefreshToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("refresh_token", token)
}

function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("auth_user")
}

async function attemptTokenRefresh(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/${REFRESH_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })
      if (!res.ok) {
        clearSession()
        dispatchAuthExpired()
        return null
      }
      const data = await res.json()
      setAccessToken(data.access)
      if (data.refresh) setRefreshToken(data.refresh)
      return data.access
    } catch {
      clearSession()
      dispatchAuthExpired()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function doFetch(
  endpoint: string,
  options: RequestInit,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return fetch(`${BASE_URL}/api/${endpoint}`, { ...options, headers })
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  let res = await doFetch(endpoint, options, token)

  if (res.status === 401 && typeof window !== "undefined") {
    const newToken = await attemptTokenRefresh()
    if (newToken) {
      res = await doFetch(endpoint, options, newToken)
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const { message, code } = extractMessage(body, res.statusText)
    throw new ApiError(res.status, message, code)
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
  created_at: string
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
  short_code?: string
  short_url?: string
}

export interface ApiQuestion {
  id: string
  exam: string
  order: number
  text: string
  image?: string | null
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

// ---- Public API (student-facing) response shapes ----

export interface ApiPublicQuestion {
  id: string
  number: number
  text: string
  image?: string | null
  type: string
  marks: number
  options: { id: string; label: string; text: string }[]
}

export interface ApiPublicExam {
  id: string
  title: string
  description: string
  instructions: string
  course: string
  course_code: string
  subject: string
  class_group: string
  term: string
  status: string
  duration_minutes: number
  total_marks: number
  passing_marks: number
  passing_percentage: number
  show_result: boolean
  allow_review: boolean
  shuffle_questions: boolean
  shuffle_answers: boolean
  question_count: number
  questions: ApiPublicQuestion[]
}

export interface ApiPublicAttempt {
  id: string
  access_token: string | null
  student_name: string
  admission_number: string
  class_group: string
  term: string
  status: string
  started_at: string | null
  duration_seconds: number | null
  answers: { question: string; selected_choice: string | null }[]
}

export interface ApiSubmitResult {
  detail?: string
  attempt_id?: string
  show_result: boolean
  allow_review?: boolean
  score?: number
  total_marks?: number
  percentage?: number
  passed?: boolean
  correct_count?: number
  incorrect_count?: number
  unanswered_count?: number
  graded_at?: string
  answers?: { question: string; selected_choice: string | null; is_correct: boolean }[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiSubject {
  id: string
  name: string
  code: string
  description: string
  created_at: string
  updated_at: string
}

export interface ApiGradeLevel {
  id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface ApiTerm {
  id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface ApiTeacherProfile {
  id: string
  user: ApiUser
  full_name: string
  employee_id: string
  department: string
  title: string
  phone: string
  bio: string
  avatar: string | null
  created_at: string
  updated_at: string
}

// ---- Frontend-friendly types (camelCase) ----

export interface ExamSummary {
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
    subject: api.subject,
    date: api.created_at,
    duration: api.duration_minutes,
    totalMarks: api.total_marks,
    passingMarks: api.passing_marks,
    status: api.status,
    questionCount: api.question_count,
    enrolledStudents: 0,
    shortCode: api.short_code,
    isPublic: api.is_public,
    createdBy: api.created_by,
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
      apiFetch<{ access: string; refresh: string; user: ApiUser }>("accounts/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: (refresh: string) =>
      apiFetch<void>("accounts/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),
    refresh: (refresh: string) =>
      apiFetch<{ access: string; refresh?: string }>("accounts/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),
    me: () => apiFetch<ApiUser>("accounts/me/"),
    profile: () => apiFetch<ApiTeacherProfile>("accounts/profile/"),
    changePassword: (oldPassword: string, newPassword: string) =>
      apiFetch<void>("accounts/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      }),
  },

  teachers: {
    list: () => apiFetch<ApiTeacher[]>("accounts/teachers/"),
  },

  students: {
    list: (params?: { grade?: string; status?: string; search?: string }) =>
      apiFetch<PaginatedResponse<ApiStudent>>(`accounts/students/${buildQuery(params || {})}`),
  },

  gradeLevels: {
    list: () => apiFetch<ApiGradeLevel[]>("grade-levels/"),
    create: (data: { name: string; display_order?: number }) =>
      apiFetch<ApiGradeLevel>("grade-levels/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`grade-levels/${id}/`, { method: "DELETE" }),
  },

  terms: {
    list: () => apiFetch<ApiTerm[]>("terms/"),
    create: (data: { name: string; display_order?: number }) =>
      apiFetch<ApiTerm>("terms/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`terms/${id}/`, { method: "DELETE" }),
  },

  subjects: {
    list: (params?: { search?: string }) =>
      apiFetch<ApiSubject[]>(`subjects/${buildQuery(params || {})}`),
    get: (id: string) => apiFetch<ApiSubject>(`subjects/${id}/`),
    create: (data: { name: string; code?: string; description?: string }) =>
      apiFetch<ApiSubject>("subjects/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiSubject>) =>
      apiFetch<ApiSubject>(`subjects/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`subjects/${id}/`, { method: "DELETE" }),
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

  upload: {
    image: async (file: File): Promise<{ url: string }> => {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const formData = new FormData()
      formData.append("file", file)
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      const res = await fetch(`${BASE_URL}/api/upload/`, {
        method: "POST",
        headers,
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new ApiError(res.status, body.detail || "Upload failed")
      }
      return res.json()
    },
  },

  health: () => apiFetch<{ status: string; database: string }>("health/"),

  // ---- Public (unauthenticated) student endpoints ----
  public: {
    exam: (token: string) => apiFetch<ApiPublicExam>(`public/exams/${token}/`),
    codeLookup: (code: string) => apiFetch<ApiPublicExam>(`public/code/${code}/`),
    startAttempt: (token: string, data: { student_name: string; admission_number: string; class_group?: string; term?: string }) =>
      apiFetch<ApiPublicAttempt>(`public/exams/${token}/start/`, { method: "POST", body: JSON.stringify(data) }),
    resumeAttempt: (attemptId: string, accessToken: string) =>
      apiFetch<ApiPublicAttempt>(`public/attempts/${attemptId}/?token=${accessToken}`),
    saveAttempt: (attemptId: string, accessToken: string, data: { answers?: { question: string; selected_choice: string | null }[]; duration_seconds?: number }) =>
      apiFetch<ApiPublicAttempt>(`public/attempts/${attemptId}/save/`, { method: "POST", body: JSON.stringify({ ...data, token: accessToken }) }),
    submitAttempt: (attemptId: string, accessToken: string, data?: { answers?: { question: string; selected_choice: string | null }[] }) =>
      apiFetch<ApiSubmitResult>(`public/attempts/${attemptId}/submit/`, { method: "POST", body: JSON.stringify({ ...data, token: accessToken }) }),
  },
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
  return (res.results || []).map(transformStudent)
}

export async function fetchExamAttempts(examId: string): Promise<AttemptSummary[]> {
  const res = await api.results.list({ exam: examId })
  return res.results.map((r) => transformAttempt(r))
}
