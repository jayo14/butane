import { api } from "@/lib/api"
import { ReportsClient } from "./page-client"

export default async function ReportsPage() {
  try {
    const resultsRes = await api.results.list()
    const allAttempts = (resultsRes?.results || []).map((r) => ({
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

    const scores = allAttempts.map((a) => (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0))
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const highest = scores.length > 0 ? Math.round(Math.max(...scores)) : 0
    const lowest = scores.length > 0 ? Math.round(Math.min(...scores)) : 0
    const passed = allAttempts.filter((a) => a.passed).length
    const passRate = allAttempts.length > 0 ? Math.round((passed / allAttempts.length) * 100) : 0

    const distribution = [
      { range: "0-29%", count: scores.filter((s) => s < 30).length, color: "bg-danger" },
      { range: "30-49%", count: scores.filter((s) => s >= 30 && s < 50).length, color: "bg-warning" },
      { range: "50-69%", count: scores.filter((s) => s >= 50 && s < 70).length, color: "bg-primary" },
      { range: "70-89%", count: scores.filter((s) => s >= 70 && s < 90).length, color: "bg-info" },
      { range: "90-100%", count: scores.filter((s) => s >= 90).length, color: "bg-success" },
    ]

    const studentsRes = await api.students.list().catch(() => [])
    const totalStudents = (studentsRes || []).length

    return (
      <ReportsClient
        stats={{
          totalStudents,
          totalExams: allAttempts.length,
          avgScore,
          highest,
          lowest,
          passRate,
          totalPassed: passed,
          totalAttempts: allAttempts.length,
        }}
        distribution={distribution}
        gradeAverages={[]}
        questions={[]}
        attempts={allAttempts as any}
      />
    )
  } catch {
    const { studentResults, mockQuestions } = await import("@/data/mock/exam-questions")
      .then(async () => {
        const sr = await import("@/data/mock/student-results")
        const mq = await import("@/data/mock/exam-questions")
        return { studentResults: sr.studentResults, mockQuestions: mq.mockQuestions }
      })
    const allAttempts = studentResults.flatMap((s) => s.attempts)
    const scores = allAttempts.map((a) => (a.score / a.totalMarks) * 100)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const highest = scores.length > 0 ? Math.round(Math.max(...scores)) : 0
    const lowest = scores.length > 0 ? Math.round(Math.min(...scores)) : 0
    const passed = allAttempts.filter((a) => a.passed).length
    const passRate = allAttempts.length > 0 ? Math.round((passed / allAttempts.length) * 100) : 0

    const distribution = [
      { range: "0-29%", count: scores.filter((s) => s < 30).length, color: "bg-danger" },
      { range: "30-49%", count: scores.filter((s) => s >= 30 && s < 50).length, color: "bg-warning" },
      { range: "50-69%", count: scores.filter((s) => s >= 50 && s < 70).length, color: "bg-primary" },
      { range: "70-89%", count: scores.filter((s) => s >= 70 && s < 90).length, color: "bg-info" },
      { range: "90-100%", count: scores.filter((s) => s >= 90).length, color: "bg-success" },
    ]

    const gradeStats = studentResults.reduce<Record<string, { count: number; totalScore: number }>>((acc, s) => {
      if (!acc[s.grade]) acc[s.grade] = { count: 0, totalScore: 0 }
      acc[s.grade].count++
      acc[s.grade].totalScore += s.summary.averageScore
      return acc
    }, {})

    const gradeAverages = Object.entries(gradeStats).map(([grade, data]) => ({
      grade,
      avg: Math.round(data.totalScore / data.count),
      count: data.count,
    }))

    return (
      <ReportsClient
        stats={{
          totalStudents: studentResults.length,
          totalExams: allAttempts.length,
          avgScore,
          highest,
          lowest,
          passRate,
          totalPassed: passed,
          totalAttempts: allAttempts.length,
        }}
        distribution={distribution}
        gradeAverages={gradeAverages}
        questions={mockQuestions}
        attempts={allAttempts as any}
      />
    )
  }
}
