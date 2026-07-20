const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(
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

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access: string; refresh: string }>("accounts/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<void>("accounts/auth/logout/", { method: "POST" }),
    refresh: (refresh: string) =>
      request<{ access: string }>("accounts/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),
    me: () => request<{ id: string; email: string; name: string; role: string }>("accounts/me/"),
    profile: () => request<{ id: string; email: string; name: string; role: string }>("accounts/profile/"),
  },

  teachers: {
    list: () => request<{ id: string; name: string; email: string }[]>("accounts/teachers/"),
  },

  students: {
    list: (params?: { grade?: string; status?: string; search?: string }) =>
      request<{ id: string; firstName: string; lastName: string; email: string; grade: string; status: string }[]>(
        `accounts/students/${buildQuery(params || {})}`,
      ),
  },

  exams: {
    list: (params?: { status?: string; search?: string; page?: number }) =>
      request<{ results: any[]; count: number; next: string | null; previous: string | null }>(
        `exams/${buildQuery(params || {})}`,
      ),
    get: (id: string) => request<any>(`exams/${id}/`),
    create: (data: any) =>
      request<any>("exams/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`exams/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
    partialUpdate: (id: string, data: any) =>
      request<any>(`exams/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`exams/${id}/`, { method: "DELETE" }),
    publish: (id: string) =>
      request<any>(`exams/${id}/publish/`, { method: "POST" }),
    duplicate: (id: string) =>
      request<any>(`exams/${id}/duplicate/`, { method: "POST" }),
    archive: (id: string) =>
      request<any>(`exams/${id}/archive/`, { method: "POST" }),
    generatePublicToken: (id: string) =>
      request<{ token: string }>(`exams/${id}/generate-public-token/`, { method: "POST" }),
    revokePublicToken: (id: string) =>
      request<void>(`exams/${id}/revoke-public-token/`, { method: "POST" }),
  },

  questions: {
    list: (examId: string) =>
      request<any[]>(`exams/${examId}/questions/`),
    create: (examId: string, data: any) =>
      request<any>(`exams/${examId}/questions/`, { method: "POST", body: JSON.stringify(data) }),
    get: (examId: string, questionId: string) =>
      request<any>(`exams/${examId}/questions/${questionId}/`),
    update: (examId: string, questionId: string, data: any) =>
      request<any>(`exams/${examId}/questions/${questionId}/`, { method: "PUT", body: JSON.stringify(data) }),
    partialUpdate: (examId: string, questionId: string, data: any) =>
      request<any>(`exams/${examId}/questions/${questionId}/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (examId: string, questionId: string) =>
      request<void>(`exams/${examId}/questions/${questionId}/`, { method: "DELETE" }),
    reorder: (examId: string, questionIds: string[]) =>
      request<any>(`exams/${examId}/questions/reorder/`, {
        method: "POST",
        body: JSON.stringify({ question_ids: questionIds }),
      }),
    duplicate: (examId: string, questionId: string) =>
      request<any>(`exams/${examId}/questions/${questionId}/duplicate/`, { method: "POST" }),
    markCorrect: (examId: string, questionId: string) =>
      request<any>(`exams/${examId}/questions/${questionId}/mark-correct/`, { method: "PATCH" }),
  },

  attempts: {
    list: (params?: { exam?: string; student?: string }) =>
      request<{ results: any[]; count: number }>(`attempts/${buildQuery(params || {})}`),
    get: (id: string) => request<any>(`attempts/${id}/`),
    create: (data: { exam: string; student: string }) =>
      request<any>("attempts/", { method: "POST", body: JSON.stringify(data) }),
    submit: (id: string, answers: Record<string, string>) =>
      request<any>(`attempts/${id}/submit/`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
  },

  results: {
    list: (params?: { exam?: string; student?: string; passed?: boolean; page?: number }) =>
      request<{ results: any[]; count: number }>(`results/${buildQuery(params || {})}`),
  },

  public: {
    examDetail: (token: string) =>
      request<any>(`public/exams/${token}/`),
    startAttempt: (token: string, studentName: string) =>
      request<any>(`public/exams/${token}/start/`, {
        method: "POST",
        body: JSON.stringify({ student_name: studentName }),
      }),
    resumeAttempt: (attemptId: string, token: string) =>
      request<any>(`public/attempts/${attemptId}/?token=${token}`),
    saveAnswers: (attemptId: string, token: string, answers: Record<string, string>) =>
      request<any>(`public/attempts/${attemptId}/save/`, {
        method: "POST",
        body: JSON.stringify({ answers, token }),
      }),
    submitAttempt: (attemptId: string, token: string, answers: Record<string, string>) =>
      request<any>(`public/attempts/${attemptId}/submit/`, {
        method: "POST",
        body: JSON.stringify({ answers, token }),
      }),
  },

  reports: {
    examStats: (examId: string) =>
      request<any>(`reports/exams/${examId}/`),
    questionStats: (examId: string) =>
      request<any[]>(`reports/exams/${examId}/questions/`),
    studentHistory: (studentId: string) =>
      request<any>(`reports/students/${studentId}/`),
  },

  health: () =>
    request<{ status: string; database: string }>("health/"),
}
