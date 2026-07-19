import { studentResults } from "@/data/mock/student-results"
import { mockQuestions } from "@/data/mock/exam-questions"
import { ReportsClient } from "./page-client"

export default function ReportsPage() {
  const allAttempts = studentResults.flatMap((s) => s.attempts)
  const scores = allAttempts.map((a) => (a.score / a.totalMarks) * 100)

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const highest = scores.length > 0 ? Math.round(Math.max(...scores)) : 0
  const lowest = scores.length > 0 ? Math.round(Math.min(...scores)) : 0
  const passed = allAttempts.filter((a) => a.passed).length
  const passRate = allAttempts.length > 0 ? Math.round((passed / allAttempts.length) * 100) : 0

  // Distribution buckets
  const distribution = [
    { range: "0-29%", count: scores.filter((s) => s < 30).length, color: "bg-danger" },
    { range: "30-49%", count: scores.filter((s) => s >= 30 && s < 50).length, color: "bg-warning" },
    { range: "50-69%", count: scores.filter((s) => s >= 50 && s < 70).length, color: "bg-primary" },
    { range: "70-89%", count: scores.filter((s) => s >= 70 && s < 90).length, color: "bg-info" },
    { range: "90-100%", count: scores.filter((s) => s >= 90).length, color: "bg-success" },
  ]

  // Per-grade aggregates
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
      attempts={allAttempts}
    />
  )
}
