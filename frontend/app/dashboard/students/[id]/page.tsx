import { api, transformStudent } from "@/lib/api"
import { notFound } from "next/navigation"
import { StudentProfileClient } from "./page-client"

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const studentsRes = await api.students.list()
    const apiStudent = (studentsRes?.results || []).find((s) => s.id === id || s.student_id === id)
    if (!apiStudent) notFound()

    const student = transformStudent(apiStudent)

    const history = await api.reports.studentHistory(id).catch(() => null)

    const attempts = history?.attempts?.map((a: any) => ({
      id: a.id || `${id}-${a.exam}`,
      examId: a.exam,
      examTitle: a.exam_title || "Unknown",
      course: a.course || "",
      date: a.submitted_at || a.created_at || "",
      score: a.score ?? 0,
      totalMarks: a.total_marks ?? 100,
      passed: a.passed ?? false,
      duration: a.duration_seconds ? Math.round(a.duration_seconds / 60) : 0,
    })) || []

    const scores = attempts.map((a: any) => (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0))
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    const passedCount = attempts.filter((a: any) => a.passed).length

    const transformed = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      grade: student.grade,
      status: student.status,
      avatar: undefined,
      summary: {
        totalExams: attempts.length,
        completedExams: attempts.length,
        averageScore: avgScore,
        highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
        lowestScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0,
        passRate: attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0,
        rank: 0,
      },
      attempts,
    }

    return <StudentProfileClient student={transformed} />
  } catch {
    notFound()
  }
}
