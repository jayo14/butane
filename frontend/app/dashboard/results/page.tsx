import { api } from "@/lib/api"
import { ResultsPageClient } from "./page-client"

export default async function ResultsPage() {
  try {
    const [resultsRes, studentsRes] = await Promise.all([
      api.results.list(),
      api.students.list().catch(() => []),
    ])

    const attempts = (resultsRes?.results || []).map((r) => ({
      id: r.id,
      examId: r.exam,
      examTitle: r.exam_title,
      course: r.course,
      date: r.graded_at,
      score: r.score,
      totalMarks: r.total_marks,
      passed: r.passed,
      duration: 0,
      studentName: r.student_name,
    }))

    const students = (studentsRes || []).map((s) => ({
      id: s.id,
      firstName: s.user.first_name,
      lastName: s.user.last_name,
      email: s.user.email,
      grade: s.grade,
      status: s.status,
      summary: { totalExams: 0, completedExams: 0, averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0, rank: 0 },
      attempts: [] as any[],
    }))

    return <ResultsPageClient attempts={attempts as any} students={students as any} />
  } catch {
    return <ResultsPageClient attempts={[]} students={[]} />
  }
}
