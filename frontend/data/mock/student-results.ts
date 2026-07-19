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
  examId: string
  examTitle: string
  course: string
  date: string
  score: number
  totalMarks: number
  passed: boolean
  duration: number
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

const exams = [
  { id: "EXM-001", title: "Algebra I - Midterm", course: "Algebra I", totalMarks: 100 },
  { id: "EXM-002", title: "English Literature - Quiz 3", course: "English Literature", totalMarks: 25 },
  { id: "EXM-003", title: "Biology - Chapter 5 Test", course: "Biology Fundamentals", totalMarks: 50 },
  { id: "EXM-004", title: "Physics - Forces & Motion", course: "Physics: Mechanics", totalMarks: 100 },
  { id: "EXM-005", title: "CS - Programming Basics", course: "Computer Science Intro", totalMarks: 50 },
]

function generateAttempts(studentId: string): ExamAttempt[] {
  const scores: Record<string, number[]> = {
    "STU-001": [85, 22, 42, 78, 45],
    "STU-002": [92, 24, 38, 88, 48],
    "STU-003": [65, 18, 30, 55, 35],
    "STU-004": [45, 12, 20, 40, 22],
    "STU-005": [78, 20, 45, 82, 40],
    "STU-006": [88, 23, 40, 90, 46],
    "STU-007": [72, 19, 35, 68, 38],
    "STU-008": [55, 15, 25, 50, 30],
  }
  const studentScores = scores[studentId] || [70, 18, 32, 65, 36]

  return exams.map((exam, i) => ({
    id: `${studentId}-${exam.id}`,
    examId: exam.id,
    examTitle: exam.title,
    course: exam.course,
    date: new Date(2026, 8 + Math.floor(i / 2), 10 + i * 5).toISOString(),
    score: studentScores[i],
    totalMarks: exam.totalMarks,
    passed: studentScores[i] >= exam.totalMarks * 0.4,
    duration: [45, 20, 35, 60, 30][i],
  }))
}

function calculateSummary(attempts: ExamAttempt[]): StudentResultSummary {
  const completed = attempts
  const scores = completed.map((a) => (a.score / a.totalMarks) * 100)
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const passed = completed.filter((a) => a.passed).length

  return {
    totalExams: exams.length,
    completedExams: completed.length,
    averageScore: Math.round(avg),
    highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
    lowestScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0,
    passRate: completed.length > 0 ? Math.round((passed / completed.length) * 100) : 0,
    rank: 0,
  }
}

const studentNames: Record<string, { first: string; last: string }> = {
  "STU-001": { first: "Alice", last: "Johnson" },
  "STU-002": { first: "Benjamin", last: "Smith" },
  "STU-003": { first: "Charlotte", last: "Davis" },
  "STU-004": { first: "Daniel", last: "Wilson" },
  "STU-005": { first: "Evelyn", last: "Brown" },
  "STU-006": { first: "Frank", last: "Martinez" },
  "STU-007": { first: "Grace", last: "Lee" },
  "STU-008": { first: "Henry", last: "Taylor" },
}

const studentGrades: Record<string, string> = {
  "STU-001": "Grade 10",
  "STU-002": "Grade 11",
  "STU-003": "Grade 9",
  "STU-004": "Grade 12",
  "STU-005": "Grade 10",
  "STU-006": "Grade 11",
  "STU-007": "Grade 8",
  "STU-008": "Grade 10",
}

const studentStatuses: Record<string, "active" | "inactive" | "suspended"> = {
  "STU-001": "active",
  "STU-002": "active",
  "STU-003": "active",
  "STU-004": "suspended",
  "STU-005": "active",
  "STU-006": "active",
  "STU-007": "active",
  "STU-008": "inactive",
}

export const studentResults: StudentWithResults[] = Object.keys(studentNames).map((id) => {
  const attempts = generateAttempts(id)
  const summary = calculateSummary(attempts)
  const name = studentNames[id]
  return {
    id,
    firstName: name.first,
    lastName: name.last,
    email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@example.com`,
    grade: studentGrades[id],
    status: studentStatuses[id],
    summary,
    attempts,
  }
})

// Compute ranks after building all students
const sorted = [...studentResults].sort((a, b) => b.summary.averageScore - a.summary.averageScore)
sorted.forEach((s, i) => {
  const found = studentResults.find((sr) => sr.id === s.id)
  if (found) found.summary.rank = i + 1
})

export function getStudentById(id: string): StudentWithResults | undefined {
  return studentResults.find((s) => s.id === id)
}

export function getStudentAttempts(studentId: string): ExamAttempt[] {
  return getStudentById(studentId)?.attempts ?? []
}
