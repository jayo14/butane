import { api } from "@/lib/api"
import { ReportCardGenerateClient } from "./page-client"

export default async function ReportCardGeneratePage() {
  let sessions: any[] = []
  let terms: any[] = []
  let classrooms: any[] = []
  let students: any[] = []

  try {
    const [sessionsRes, termsRes, classroomsRes, studentsRes] = await Promise.all([
      api.academics.sessions().catch(() => []),
      api.terms.list().catch(() => []),
      api.academics.classrooms().catch(() => []),
      api.students.list().catch(() => []),
    ])
    sessions = (sessionsRes as any)?.results || sessionsRes || []
    terms = (termsRes as any)?.results || termsRes || []
    classrooms = (classroomsRes as any)?.results || classroomsRes || []
    students = (studentsRes as any)?.results || studentsRes || []
  } catch {
    // Use empty arrays as fallback
  }

  return (
    <ReportCardGenerateClient
      initialSessions={sessions}
      initialTerms={terms}
      initialClassrooms={classrooms}
      initialStudents={students}
    />
  )
}
