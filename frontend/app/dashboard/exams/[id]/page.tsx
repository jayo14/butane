import { api, transformExam } from "@/lib/api"
import { notFound } from "next/navigation"
import { ExamDetailClient } from "./page-client"

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const [examApi, questions, results] = await Promise.all([
      api.exams.get(id),
      api.questions.list(id).catch(() => []),
      api.results.list({ exam: id }).catch(() => ({ results: [] })),
    ])

    const exam = transformExam(examApi)
    if (!exam) notFound()

    const allAttempts = results.results.map((r) => ({
      id: r.id,
      examId: r.exam,
      examTitle: r.exam_title,
      subject: r.subject,
      date: r.graded_at,
      score: r.score,
      totalMarks: r.total_marks,
      passed: r.passed,
      duration: r.duration_seconds || 0,
      studentName: r.student_name,
      studentGrade: "",
    }))

    const stats = {
      totalAttempts: allAttempts.length,
      passed: allAttempts.filter((a) => a.passed).length,
      failed: allAttempts.filter((a) => !a.passed).length,
      averageScore: allAttempts.length > 0
        ? Math.round(allAttempts.reduce((sum, a) => sum + (a.score / a.totalMarks) * 100, 0) / allAttempts.length)
        : 0,
    }

    return (
      <ExamDetailClient
        exam={exam}
        questions={questions.map((q) => ({ id: q.id, number: q.order, text: q.text }))}
        attempts={allAttempts}
        stats={stats}
      />
    )
  } catch {
    notFound()
  }
}
