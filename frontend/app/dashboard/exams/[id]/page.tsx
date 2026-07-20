import { mockExams } from "@/data/mock/exams"
import { mockQuestions } from "@/data/mock/exam-questions"
import { studentResults } from "@/data/mock/student-results"
import { notFound } from "next/navigation"
import { ExamDetailClient } from "./page-client"

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const exam = mockExams.find((e) => e.id === id)
  if (!exam) notFound()

  const relatedAttempts = studentResults.flatMap((s) =>
    s.attempts.filter((a) => a.examId === id).map((a) => ({
      ...a,
      studentName: `${s.firstName} ${s.lastName}`,
      studentGrade: s.grade,
    })),
  )

  const questions = mockQuestions.filter((q) => q.examId === id)

  const stats = {
    totalAttempts: relatedAttempts.length,
    passed: relatedAttempts.filter((a) => a.passed).length,
    failed: relatedAttempts.filter((a) => !a.passed).length,
    averageScore: relatedAttempts.length > 0
      ? Math.round(relatedAttempts.reduce((sum, a) => sum + (a.score / a.totalMarks) * 100, 0) / relatedAttempts.length)
      : 0,
  }

  return <ExamDetailClient exam={exam} questions={questions} attempts={relatedAttempts} stats={stats} />
}
