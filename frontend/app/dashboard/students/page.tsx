import { api, transformStudent } from "@/lib/api"
import { StudentsPageClient } from "./page-client"

export default async function StudentsPage() {
  try {
    const studentsRes = await api.students.list()
    const students = (studentsRes || []).map(transformStudent)

    const transformed = students.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      grade: s.grade,
      status: s.status,
      summary: {
        totalExams: 0,
        completedExams: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        rank: 0,
      },
      attempts: [] as { id: string; examId: string; examTitle: string; course: string; date: string; score: number; totalMarks: number; passed: boolean; duration: number }[],
    }))

    return <StudentsPageClient students={transformed} />
  } catch {
    return <StudentsPageClient students={[]} />
  }
}
