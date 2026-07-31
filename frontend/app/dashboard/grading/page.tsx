import { api } from "@/lib/api"
import { GradingPageClient } from "./page-client"

export default async function GradingPage() {
  try {
    const [
      sessionsRes,
      classroomsRes,
      termsRes,
      subjectsRes,
      gradeScalesRes,
      assignmentsRes,
      profile,
    ] = await Promise.all([
      api.academics.sessions().catch(() => ({ results: [] })),
      api.academics.classrooms().catch(() => ({ results: [] })),
      api.terms.list().catch(() => []),
      api.subjects.list().catch(() => []),
      api.academics.gradeScales().catch(() => []),
      api.academics.teachingAssignments().catch(() => []),
      api.auth.profile().catch(() => null),
    ])

    return (
      <GradingPageClient
        initialSessions={sessionsRes?.results || []}
        initialClassrooms={classroomsRes?.results || []}
        initialTerms={termsRes || []}
        initialSubjects={subjectsRes || []}
        initialGradeScales={gradeScalesRes || []}
        initialAssignments={assignmentsRes || []}
        profile={profile}
      />
    )
  } catch (error) {
    console.error("Error loading grading page data", error)
    return (
      <GradingPageClient
        initialSessions={[]}
        initialClassrooms={[]}
        initialTerms={[]}
        initialSubjects={[]}
        initialGradeScales={[]}
        initialAssignments={[]}
        profile={null}
      />
    )
  }
}
